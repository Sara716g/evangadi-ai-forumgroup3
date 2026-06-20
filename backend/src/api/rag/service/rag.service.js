import { GoogleGenerativeAI } from "@google/generative-ai";
import { safeExecute } from "../../../../db/config.js";
import { BadRequestError } from "../../../utils/errors/index.js";
import { cosineSimilarity } from "../../../utils/vector.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ------------------------------
// Embedding for QUERY ONLY
// ------------------------------
const generateQueryEmbedding = async (text) => {
  const model = genAI.getGenerativeModel({
    model: "gemini-embedding-001",
  });

  const result = await model.embedContent({
    content: { parts: [{ text }] },
    taskType: "RETRIEVAL_QUERY",
  });

  return result.embedding.values;
};

// ------------------------------
// T-23 SERVICE
// ------------------------------
export const searchInDocumentService = async (
  documentId,
  userId,
  query,
  k = 5
) => {
  // 1. Verify ownership + status
  const docs = await safeExecute(
    `
    SELECT *
    FROM documents
    WHERE document_id = ?
      AND user_id = ?
    LIMIT 1
    `,
    [documentId, userId]
  );

  const document = docs[0];

  if (!document) {
    throw new BadRequestError("Document not found.");
  }

  if (document.status !== "ready") {
    throw new BadRequestError("Document is not ready for search.");
  }

  // 2. Embed query
  const queryVector = await generateQueryEmbedding(query);

  // 3. Fetch chunks + embeddings
  const chunks = await safeExecute(
    `
    SELECT
      dc.chunk_id,
      dc.chunk_index,
      dc.content,
      dcv.embedding
    FROM document_chunks dc
    JOIN document_chunk_vectors dcv
      ON dc.chunk_id = dcv.chunk_id
    WHERE dc.document_id = ?
    `,
    [documentId]
  );

  // 4. Similarity scoring
  const THRESHOLD = 0.4;

  const ranked = chunks
    .map((chunk) => {
      const vector = JSON.parse(chunk.embedding);

      const score = cosineSimilarity(queryVector, vector);

      return {
        chunkId: chunk.chunk_id,
        chunkIndex: chunk.chunk_index,
        score,
        excerpt: chunk.content,
      };
    })
    .filter((c) => c.score >= THRESHOLD)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);

  return ranked;
};