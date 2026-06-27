import { safeExecute } from "../../../../db/config.js";
import { NotFoundError } from "../../../utils/errors/index.js";
import {
  parseEmbedding,
  cosineSimilarity,
  rankVectorsBySimilarity,
} from "../../../utils/vector/vector.utils.js";
import { getAttachmentsForAnswerIds } from "../../answer/service/answer.service.js";

// =========================
// CONFIG
// =========================
const DEFAULT_K = Number.parseInt(process.env.RECOMMEND_K, 10) || 5;
const DEFAULT_THRESHOLD =
  Number.parseFloat(process.env.RECOMMEND_THRESHOLD) || 0.75;

// =========================
// EMBEDDING GENERATION (GEMINI)
// =========================
const generateEmbedding = async (text) => {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "models/gemini-embedding-2",
        content: { parts: [{ text }] },
        taskType: "RETRIEVAL_DOCUMENT",
      }),
    },
  );

  const data = await response.json();
  return data.embedding.values;
};

// =========================
// CREATE QUESTION + VECTOR
// =========================
const generateQuestionHash = () => {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

export const createQuestionWithVectorService = async ({
  title,
  content,
  userId,
}) => {
  const questionHash = generateQuestionHash();

  // 1. Insert question
  const insertSql = `
    INSERT INTO questions (question_hash, user_id, title, content)
    VALUES (?, ?, ?, ?)
  `;

  const result = await safeExecute(insertSql, [
    questionHash,
    userId,
    title,
    content,
  ]);

  const questionId = result.insertId;

  // 2. Generate embedding
  let embedding = null;
  let vectorStatus = "failed";

  try {
    embedding = await generateEmbedding(title);
    vectorStatus = "ready";
  } catch (error) {
    console.error(
      `[T-11] Embedding failed for question ${questionId}:`,
      error.message,
    );
  }

  // 3. Save vector
  const vectorSql = `
    INSERT INTO question_vectors (question_id, source_text, embedding, status)
    VALUES (?, ?, ?, ?)
  `;

  await safeExecute(vectorSql, [
    questionId,
    title,
    JSON.stringify(embedding ?? []),
    vectorStatus,
  ]);

  return { id: questionId, questionHash, title, content, userId };
};

// =========================
// SIMILAR QUESTIONS (VECTOR SEARCH)
// =========================
const fetchAllReadyVectors = async (excludeQuestionId = null) => {
  const sql =
    excludeQuestionId === null
      ? `SELECT question_id, embedding FROM question_vectors WHERE status = 'ready'`
      : `SELECT question_id, embedding FROM question_vectors WHERE status = 'ready' AND question_id != ?`;

  const params = excludeQuestionId === null ? [] : [excludeQuestionId];
  return safeExecute(sql, params);
};

const hydrateQuestionsByIds = async (rankedMatches, scoreByQuestionId) => {
  if (rankedMatches.length === 0) return [];

  const questionIds = rankedMatches.map((m) => m.questionId);
  const placeholders = questionIds.map(() => "?").join(",");

  const sql = `
    SELECT
      q.question_id AS id,
      q.question_hash AS questionHash,
      q.title,
      q.content,
      q.created_at AS createdAt,
      q.updated_at AS updatedAt,
      u.user_id AS authorId,
      u.first_name AS authorFirstName,
      u.last_name AS authorLastName,
      COUNT(a.answer_id) AS answerCount
    FROM questions q
    INNER JOIN users u ON q.user_id = u.user_id
    LEFT JOIN answers a ON q.question_id = a.question_id
    WHERE q.question_id IN (${placeholders})
    GROUP BY q.question_id, q.question_hash, q.title, q.content,
             q.created_at, q.updated_at,
             u.user_id, u.first_name, u.last_name
  `;

  const rows = await safeExecute(sql, questionIds);
  const rowById = new Map(rows.map((r) => [r.id, r]));

  return rankedMatches
    .map((match) => {
      const row = rowById.get(match.questionId);
      if (!row) return null;

      return {
        id: row.id,
        questionHash: row.questionHash,
        title: row.title,
        content: row.content,
        answerCount: Number(row.answerCount),
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        author: {
          id: row.authorId,
          firstName: row.authorFirstName,
          lastName: row.authorLastName,
        },
        score: scoreByQuestionId.get(match.questionId),
      };
    })
    .filter(Boolean);
};

export const getSimilarQuestionsService = async ({
  questionHash,
  k = DEFAULT_K,
  threshold = DEFAULT_THRESHOLD,
}) => {
  const sourceSql = `
    SELECT q.question_id, q.question_hash, qv.embedding
    FROM questions q
    INNER JOIN question_vectors qv ON q.question_id = qv.question_id
    WHERE q.question_hash = ? AND qv.status = 'ready'
    LIMIT 1
  `;

  const sourceRows = await safeExecute(sourceSql, [questionHash]);

  if (sourceRows.length === 0) {
    throw new NotFoundError("Question not found or vector not ready");
  }

  const sourceQuestion = sourceRows[0];
  const sourceVector = parseEmbedding(sourceQuestion.embedding);

  const vectorRows = await fetchAllReadyVectors(sourceQuestion.question_id);

  const scoredMatches = rankVectorsBySimilarity(sourceVector, vectorRows, {
    k,
    threshold,
    excludeQuestionId: sourceQuestion.question_id,
  });

  const scoreByQuestionId = new Map(
    scoredMatches.map((m) => [m.questionId, m.score]),
  );

  const data = await hydrateQuestionsByIds(scoredMatches, scoreByQuestionId);

  return {
    data,
    meta: {
      total: data.length,
      k,
      threshold,
      query: null,
      questionHash,
    },
  };
};

// =========================
// SINGLE QUESTION + ANSWERS (with attachments)
// =========================
export const getSingleQuestionWithAnswersService = async ({ questionHash }) => {
  const questionSql = `
    SELECT
      q.question_id AS id,
      q.question_hash AS questionHash,
      q.title,
      q.content,
      q.created_at AS createdAt,
      q.updated_at AS updatedAt,
      u.user_id AS authorId,
      u.first_name AS authorFirstName,
      u.last_name AS authorLastName
    FROM questions q
    INNER JOIN users u ON q.user_id = u.user_id
    WHERE q.question_hash = ?
    LIMIT 1
  `;

  const questionRows = await safeExecute(questionSql, [questionHash]);
  if (questionRows.length === 0) {
    throw new NotFoundError("Question not found");
  }

  const q = questionRows[0];

  const answersSql = `
    SELECT
      a.answer_id AS id,
      a.content,
      a.created_at AS createdAt,
      a.updated_at AS updatedAt,
      u.user_id AS authorId,
      u.first_name AS authorFirstName,
      u.last_name AS authorLastName
    FROM answers a
    INNER JOIN users u ON a.user_id = u.user_id
    WHERE a.question_id = ?
    ORDER BY a.created_at ASC
  `;

  const answerRows = await safeExecute(answersSql, [q.id]);
  const answerIds = answerRows.map((row) => row.id);
  const attachmentsByAnswerId = await getAttachmentsForAnswerIds(answerIds);

  const answers = answerRows.map((row) => ({
    id: row.id,
    content: row.content,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    author: {
      id: row.authorId,
      firstName: row.authorFirstName,
      lastName: row.authorLastName,
    },
    attachments: attachmentsByAnswerId.get(row.id) || [],
  }));

  return {
    id: q.id,
    questionHash: q.questionHash,
    title: q.title,
    content: q.content,
    createdAt: q.createdAt,
    updatedAt: q.updatedAt,
    author: {
      id: q.authorId,
      firstName: q.authorFirstName,
      lastName: q.authorLastName,
    },
    answers,
  };
};
// =========================
// LIST / SEARCH QUESTIONS
// =========================
export const getAllQuestionsService = async ({ search = "", mine = false, userId = null }) => {
  const conditions = [];
  const params = [];

  if (search && search.trim().length > 0) {
    conditions.push("(q.title LIKE ? OR q.content LIKE ?)");
    const likeTerm = `%${search.trim()}%`;
    params.push(likeTerm, likeTerm);
  }

  if (mine && userId) {
    conditions.push("q.user_id = ?");
    params.push(userId);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const sql = `
    SELECT
      q.question_id AS id,
      q.question_hash AS questionHash,
      q.title,
      q.content,
      q.created_at AS createdAt,
      q.updated_at AS updatedAt,
      u.user_id AS authorId,
      u.first_name AS authorFirstName,
      u.last_name AS authorLastName,
      COUNT(a.answer_id) AS answerCount
    FROM questions q
    INNER JOIN users u ON q.user_id = u.user_id
    LEFT JOIN answers a ON q.question_id = a.question_id
    ${whereClause}
    GROUP BY q.question_id, q.question_hash, q.title, q.content,
             q.created_at, q.updated_at,
             u.user_id, u.first_name, u.last_name
    ORDER BY q.created_at DESC
    LIMIT 100
  `;

  const rows = await safeExecute(sql, params);

  return rows.map((row) => ({
    id: row.id,
    questionHash: row.questionHash,
    title: row.title,
    content: row.content,
    answerCount: Number(row.answerCount),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    author: {
      id: row.authorId,
      firstName: row.authorFirstName,
      lastName: row.authorLastName,
    },
  }));
};