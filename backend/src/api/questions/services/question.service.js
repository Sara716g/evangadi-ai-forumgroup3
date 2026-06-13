import { db } from "../../../../db/config.js";
import { GoogleGenAI } from "@google/genai";
import { BadRequestError } from "../../../utils/errors/index.js";

// Configuration constants for semantic search
const GEMINI_EMBEDDING_MODEL =
  process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-001";
const RECOMMEND_THRESHOLD = Number(process.env.RECOMMEND_THRESHOLD ?? 0.75); // Default similarity threshold
const RECOMMEND_K = Number(process.env.RECOMMEND_K ?? 5); // Default max results to return

// Initialize Gemini API client with API key from environment
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY environment variable is required for semantic search",
    );
  }
  return new GoogleGenAI({ apiKey });
};

// Convert text to embedding vector using Gemini API
const getEmbedding = async (text) => {
  const ai = getGeminiClient();
  // Call Gemini embedContent with RETRIEVAL_QUERY task type
  const response = await ai.models.embedContent({
    model: GEMINI_EMBEDDING_MODEL,
    contents: [text],
    config: {
      taskType: "RETRIEVAL_QUERY",
    },
  });

  if (!response?.embeddings || !Array.isArray(response.embeddings)) {
    throw new Error("Failed to embed query text");
  }

  const embeddingObject = response.embeddings[0];
  if (!embeddingObject) {
    throw new Error("Invalid embedding response from Gemini");
  }
  // Extract vector values from various possible response formats
  const values =
    Array.isArray(embeddingObject.values) && embeddingObject.values.length > 0
      ? embeddingObject.values
      : Array.isArray(embeddingObject.embedding) &&
          embeddingObject.embedding.length > 0
        ? embeddingObject.embedding
        : Array.isArray(embeddingObject.value) &&
            embeddingObject.value.length > 0
          ? embeddingObject.value
          : null;

  if (!values) {
    throw new Error(
      "Invalid embedding response from Gemini: missing vector values",
    );
  }

  return values;
};

// Calculate cosine similarity between two vectors: dot(a,b) / (||a|| * ||b||)
const cosineSimilarity = (a, b) => {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
    return 0;
  }

  let dot = 0; // Dot product accumulator
  let normA = 0; // Norm of vector a
  let normB = 0; // Norm of vector b

  // Calculate dot product and norms in single pass
  for (let i = 0; i < a.length; i += 1) {
    const x = Number(a[i]);
    const y = Number(b[i]);
    dot += x * y;
    normA += x * x;
    normB += y * y;
  }

  // Avoid division by zero
  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};

// Parse embedding vector from database row (JSON or array format)
const parseEmbeddingRow = (row) => {
  if (!row.embedding) return null;
  // Handle JSON string format by parsing
  if (typeof row.embedding === "string") {
    try {
      return JSON.parse(row.embedding);
    } catch (error) {
      return null;
    }
  }
  // Return already parsed array
  return row.embedding;
};

// Semantic search service: Find questions similar to query using embeddings
export const searchQuestionsSemanticService = async ({
  query,
  k,
  threshold,
}) => {
  // Validate and normalize query input
  const normalizedQuery = String(query || "").trim();
  if (!normalizedQuery || normalizedQuery.length < 5) {
    throw new BadRequestError("Query must be at least 5 characters long");
  }

  // Constrain parameters to valid ranges
  const limit = Number.isInteger(k)
    ? Math.min(Math.max(k, 1), 20)
    : RECOMMEND_K;
  const minScore =
    typeof threshold === "number"
      ? Math.min(Math.max(threshold, 0), 1)
      : RECOMMEND_THRESHOLD;

  // Step 1: Get embedding vector for the search query
  const queryEmbedding = await getEmbedding(normalizedQuery);

  // Step 2: Fetch all ready vectors from database with question data
  const [vectorRows] = await db.execute(
    "SELECT q.question_id, q.question_hash, q.title, q.content, q.created_at, q.updated_at, q.user_id, qv.embedding FROM question_vectors qv JOIN questions q ON qv.question_id = q.question_id WHERE qv.status = ?;",
    ["ready"],
  );

  const vectors = Array.isArray(vectorRows) ? vectorRows : [];

  // Step 3: Calculate similarity scores and filter/sort results
  const scoredRows = vectors
    .map((row) => {
      const values = parseEmbeddingRow(row);
      if (!Array.isArray(values) || values.length === 0) return null;

      // Calculate cosine similarity between query and question embedding
      const score = cosineSimilarity(queryEmbedding, values);
      return {
        ...row,
        score,
      };
    })
    .filter((item) => item && item.score >= minScore) // Filter by threshold
    .sort((a, b) => b.score - a.score) // Sort by score descending
    .slice(0, limit); // Take top k results

  // Return empty results if no matches found
  if (scoredRows.length === 0) {
    return {
      items: [],
      total: 0,
      k: limit,
      threshold: minScore,
    };
  }

  // Step 4: Fetch full question details and answer count for top results
  const questionIds = scoredRows.map((item) => item.question_id);
  const placeholders = questionIds.map(() => "?").join(",");

  const [questionRows] = await db.execute(
    `SELECT q.question_id, q.question_hash, q.title, q.content, q.created_at, q.updated_at, u.user_id AS author_id, u.first_name AS author_first_name, u.last_name AS author_last_name, (SELECT COUNT(*) FROM answers a WHERE a.question_id = q.question_id) AS answerCount
     FROM questions q
     JOIN users u ON q.user_id = u.user_id
     WHERE q.question_id IN (${placeholders})
     ORDER BY FIELD(q.question_id, ${placeholders})`,
    [...questionIds, ...questionIds],
  );

  const questionDetails = Array.isArray(questionRows)
    ? questionRows
    : questionRows[0];

  // Step 5: Format response with similarity scores
  const items = scoredRows.map((scored) => {
    const question = questionDetails.find(
      (item) => item.question_id === scored.question_id,
    );
    return {
      id: question.question_id,
      questionHash: question.question_hash,
      title: question.title,
      content: question.content,
      answerCount: Number(question.answerCount ?? 0),
      createdAt: question.created_at,
      updatedAt: question.updated_at,
      author: {
        id: question.author_id,
        firstName: question.author_first_name,
        lastName: question.author_last_name,
      },
      score: Number(scored.score.toFixed(6)), // Round to 6 decimals
    };
  });

  return {
    items,
    total: items.length,
    k: limit,
    threshold: minScore,
  };
};
