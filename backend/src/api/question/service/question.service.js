/**
 * ============================================================================
 * Domain: Core Forum (Blue Domain) + AI Search/Embeddings (Green Domain)
 * ============================================================================
 * Handles transactional operations for questions and semantic search vectors.
 * Maintains clean separation between:
 * - Core CRUD operations (Blue Domain): create, list, fetch questions
 * - Vector embeddings (Green Domain): semantic search via question_vectors
 *
 * Status Tracking Pattern:
 * - Vector status: 'ready' (complete), 'pending' (processing), 'failed' (error)
 * - Enables async embedding generation without blocking question creation
 * ============================================================================
 */

import { safeExecute } from '../../../../db/config.js';
import { NotFoundError, ServiceUnavailableError } from '../../../utils/errors/index.js';
import { generateEmbedding, generateText } from '../../../utils/ai.js';
import { embedSearchQuery } from '../../../utils/gemini/embedding.service.js';
import { generateQuestionDraftCoachService as generateQuestionDraftCoachFromGemini } from './GeminiTextCoach.service.js';
import { generateHexString, cosineSimilarity, normalizeEmbedding } from './vector.service.js';
import { parseEmbedding } from '../../../utils/vector/vector.utils.js';

const DEFAULT_RECOMMEND_THRESHOLD = Number(process.env.RECOMMEND_THRESHOLD ?? 0.75);
const DEFAULT_K = 5;

const mapQuestionRow = row => ({
  id: row.question_id,
  questionHash: row.question_hash,
  title: row.title,
  content: row.content,
  answerCount: Number(row.answer_count ?? 0),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  author: {
    id: row.author_id,
    firstName: row.first_name,
    lastName: row.last_name,
    username: row.username || `${row.first_name || ''} ${row.last_name || ''}`.trim() || 'anonymous',
  },
});

const mapAnswerRow = row => ({
  id: row.answer_id,
  content: row.content,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  voteCount: Number(row.vote_count ?? 0),
  commentCount: Number(row.comment_count ?? 0),
  userHasVoted: row.user_has_voted === 1,
  author: {
    id: row.author_id,
    firstName: row.first_name,
    lastName: row.last_name,
  },
});

/**
 * Generates embedding asynchronously without blocking question creation.
 * Implements status tracking: pending → ready/failed
 * Can be triggered by background worker for scalability.
 */
export const generateQuestionEmbeddingAsync = async ({ questionId, sourceText }) => {
  try {
    if (!sourceText || typeof sourceText !== 'string' || sourceText.trim().length === 0) {
      await safeExecute(
        `UPDATE question_vectors SET status = 'failed', updated_at = NOW() WHERE question_id = ?`,
        [questionId],
      );
      return { success: false, error: 'Source text is required' };
    }

    const vector = await generateEmbedding(sourceText);
    if (Array.isArray(vector) && vector.length > 0) {
      await safeExecute(
        `UPDATE question_vectors SET embedding = ?, status = 'ready', updated_at = NOW() WHERE question_id = ?`,
        [JSON.stringify(vector), questionId],
      );
      return { success: true, status: 'ready' };
    }

    console.error('[Embedding] Empty vector returned from Gemini');
    await safeExecute(
      `UPDATE question_vectors SET status = 'failed', updated_at = NOW() WHERE question_id = ?`,
      [questionId],
    );
    return { success: false, error: 'Embedding generation returned empty vector' };
  } catch (error) {
    console.error('[Embedding] Failed to generate embedding:', error);
    await safeExecute(
      `UPDATE question_vectors SET status = 'failed', updated_at = NOW() WHERE question_id = ?`,
      [questionId],
    );
    return { success: false, error: error.message };
  }
};

export const createQuestionWithVectorService = async ({ userId, title, content }) => {
  const questionHash = generateHexString(16);

  const insertSql = `INSERT INTO questions (question_hash, user_id, title, content) VALUES (?, ?, ?, ?)`;
  const insertResult = await safeExecute(insertSql, [questionHash, userId, title, content]);
  const questionId = insertResult.insertId;

  const sourceText = `${title}\n\n${content}`;
  const vectorSql = `INSERT INTO question_vectors (question_id, source_text, embedding, status) VALUES (?, ?, '[]', 'pending')`;
  await safeExecute(vectorSql, [questionId, sourceText]);

  await generateQuestionEmbeddingAsync({ questionId, sourceText });

  return {
    id: questionId,
    questionHash,
    title,
    content,
    userId,
  };
};

export const getQuestionsService = async ({ userId, search, mine }) => {
  const filters = [];
  const params = [];
  let whereClause = '';

  if (mine) {
    filters.push('q.user_id = ?');
    params.push(userId);
  }

  if (search && String(search).trim().length > 0) {
    filters.push('(q.title LIKE ? OR q.content LIKE ?)');
    const likeValue = `%${String(search).trim()}%`;
    params.push(likeValue, likeValue);
  }

  if (filters.length > 0) {
    whereClause = `WHERE ${filters.join(' AND ')}`;
  }

  const sql = `
    SELECT
      q.question_id,
      q.question_hash,
      q.title,
      q.content,
      q.created_at,
      q.updated_at,
      u.user_id AS author_id,
      u.first_name,
      u.last_name,
      COALESCE(ac.answer_count, 0) AS answer_count
    FROM questions q
    JOIN users u ON q.user_id = u.user_id
    LEFT JOIN (
      SELECT question_id, COUNT(*) AS answer_count
      FROM answers
      GROUP BY question_id
    ) ac ON ac.question_id = q.question_id
    ${whereClause}
    ORDER BY q.created_at DESC
  `;

  const rows = await safeExecute(sql, params);
  return rows.map(mapQuestionRow);
};

export const getSingleQuestionService = async ({ questionHash, userId }) => {
  const sql = `
    SELECT
      q.question_id,
      q.question_hash,
      q.title,
      q.content,
      q.created_at,
      q.updated_at,
      u.user_id AS author_id,
      u.first_name,
      u.last_name
    FROM questions q
    JOIN users u ON q.user_id = u.user_id
    WHERE q.question_hash = ?
    LIMIT 1
  `;

  const rows = await safeExecute(sql, [questionHash]);
  if (rows.length === 0) {
    throw new NotFoundError('Question not found');
  }

  const question = rows[0];

  const answersSql = `
    SELECT
      a.answer_id,
      a.content,
      a.created_at,
      a.updated_at,
      u.user_id AS author_id,
      u.first_name,
      u.last_name,
      COALESCE(v.vote_count, 0) AS vote_count,
      COALESCE(c.comment_count, 0) AS comment_count,
      CASE WHEN uv.vote_id IS NOT NULL THEN 1 ELSE 0 END AS user_has_voted
    FROM answers a
    JOIN users u ON a.user_id = u.user_id
    LEFT JOIN (
      SELECT answer_id, COUNT(*) AS vote_count
      FROM answer_votes
      GROUP BY answer_id
    ) v ON v.answer_id = a.answer_id
    LEFT JOIN (
      SELECT answer_id, COUNT(*) AS comment_count
      FROM answer_comments
      GROUP BY answer_id
    ) c ON c.answer_id = a.answer_id
    LEFT JOIN answer_votes uv ON uv.answer_id = a.answer_id AND uv.user_id = ?
    WHERE a.question_id = ?
    ORDER BY a.created_at ASC
  `;

  const answers = await safeExecute(answersSql, [userId || null, question.question_id]);

  return {
    question: {
      id: question.question_id,
      questionHash: question.question_hash,
      title: question.title,
      content: question.content,
      answerCount: answers.length,
      createdAt: question.created_at,
      updatedAt: question.updated_at,
      author: {
        id: question.author_id,
        firstName: question.first_name,
        lastName: question.last_name,
      },
    },
    answers: answers.map(mapAnswerRow),
    answersMeta: {
      limit: 100,
      total: answers.length,
    },
  };
};

const selectReadyQuestionVectorsSql = `
  SELECT
    q.question_id,
    q.question_hash,
    q.title,
    q.content,
    q.created_at,
    q.updated_at,
    u.user_id AS author_id,
    u.first_name,
    u.last_name,
    COALESCE(ac.answer_count, 0) AS answer_count,
    qv.embedding
  FROM question_vectors qv
  JOIN questions q ON qv.question_id = q.question_id
  JOIN users u ON q.user_id = u.user_id
  LEFT JOIN (
    SELECT question_id, COUNT(*) AS answer_count
    FROM answers
    GROUP BY question_id
  ) ac ON ac.question_id = q.question_id
  WHERE qv.status = 'ready'
`;

export const searchQuestionsSemanticService = async ({ query, k, threshold }) => {
  const limit = Number(k ?? DEFAULT_K);
  const minSimilarity = Number(threshold ?? DEFAULT_RECOMMEND_THRESHOLD);

  let queryVector;
  try {
    const vector = await embedSearchQuery(query);
    queryVector = normalizeEmbedding(vector);
  } catch (error) {
    if (error.statusCode) throw error;
    throw new ServiceUnavailableError(`Embedding generation failed: ${error.message}`);
  }

  if (!Array.isArray(queryVector) || queryVector.length === 0) {
    throw new ServiceUnavailableError('Semantic search embedding failed');
  }

  const rows = await safeExecute(selectReadyQuestionVectorsSql, []);

  const results = rows
    .map(row => {
      const embedding = normalizeEmbedding(parseEmbedding(row.embedding));
      return {
        ...mapQuestionRow(row),
        score: cosineSimilarity(queryVector, embedding),
      };
    })
    .filter(item => item.score >= minSimilarity)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return {
    data: results,
    meta: {
      total: results.length,
      k: limit,
      threshold: minSimilarity,
      query,
      questionHash: null,
    },
  };
};

export const getSimilarQuestionsService = async ({ questionHash, k, threshold }) => {
  const limit = Number(k ?? DEFAULT_K);
  const minSimilarity = Number(threshold ?? DEFAULT_RECOMMEND_THRESHOLD);

  const sourceSql = `
    SELECT
      q.question_id,
      qv.embedding
    FROM question_vectors qv
    JOIN questions q ON qv.question_id = q.question_id
    WHERE q.question_hash = ?
    LIMIT 1
  `;

  const sourceRows = await safeExecute(sourceSql, [questionHash]);
  if (sourceRows.length === 0) {
    throw new NotFoundError('Question not found');
  }

  const sourceEmbedding = normalizeEmbedding(parseEmbedding(sourceRows[0].embedding));
  if (sourceEmbedding.length === 0) {
    throw new ServiceUnavailableError('Source question embedding is unavailable');
  }

  const rows = await safeExecute(`${selectReadyQuestionVectorsSql} AND q.question_id != ?`, [sourceRows[0].question_id]);
  const results = rows
    .map(row => {
        const embedding = normalizeEmbedding(parseEmbedding(row.embedding));
      return {
        ...mapQuestionRow(row),
        score: cosineSimilarity(sourceEmbedding, embedding),
      };
    })
    .filter(item => item.score >= minSimilarity)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return {
    data: results,
    meta: {
      total: results.length,
      k: limit,
      threshold: minSimilarity,
      query: null,
      questionHash,
    },
  };
};

export const generateQuestionDraftCoachService = async ({ title, content }) => {
  return await generateQuestionDraftCoachFromGemini({ title, content });
};

export const assessAnswerAgainstQuestionService = async ({ questionHash, answerText }) => {
  const sql = `
    SELECT
      q.question_id,
      q.title,
      q.content
    FROM questions q
    WHERE q.question_hash = ?
    LIMIT 1
  `;

  const rows = await safeExecute(sql, [questionHash]);
  if (rows.length === 0) {
    throw new NotFoundError('Question not found');
  }

  const question = rows[0];
  const prompt = `You are a skilled forum moderator.
Evaluate the answer below against the question content. Provide:
1) A short judgment whether the answer is relevant and on-topic.
2) A relevance score from 0 to 100.
3) Two improvement suggestions for the answer.
4) If the answer misses the main point, explain what is missing.

Question Title: ${question.title}
Question Content: ${question.content}
Answer: ${answerText}

Respond clearly in plain text.`;

  const assessment = await generateText(prompt);
  return {
    question: {
      id: question.question_id,
      title: question.title,
      content: question.content,
    },
    answerText,
    assessment,
  };
};
