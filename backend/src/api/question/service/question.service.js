import { safeExecute } from '../../../../db/config.js';
import { NotFoundError } from '../../../utils/errors/index.js';
import {
  parseEmbedding,
  cosineSimilarity,
  rankVectorsBySimilarity,
} from '../../../utils/vector/vector.utils.js';

// Configuration fallbacks from environment variables
const DEFAULT_K = Number.parseInt(process.env.RECOMMEND_K, 10) || 5;
const DEFAULT_THRESHOLD = Number.parseFloat(process.env.RECOMMEND_THRESHOLD) || 0.75;

// Helper: Fetches all processed question embeddings, optionally excluding a specific ID
const fetchAllReadyVectors = async (excludeQuestionId = null) => {
  const sql = excludeQuestionId === null
      ? `SELECT question_id, embedding FROM question_vectors WHERE status = 'ready'`
      : `SELECT question_id, embedding FROM question_vectors WHERE status = 'ready' AND question_id != ?`;
  const params = excludeQuestionId === null ? [] : [excludeQuestionId];
  return safeExecute(sql, params);
};

// Helper: Fetches full question/author details for matched IDs and retains ranked order
const hydrateQuestionsByIds = async (rankedMatches, scoreByQuestionId) => {
  if (rankedMatches.length === 0) return [];
  const questionIds = rankedMatches.map(match => match.questionId);
  const placeholders = questionIds.map(() => '?').join(', ');
  
  // Query to join questions, authors, and aggregate answer counts
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
    GROUP BY q.question_id, q.question_hash, q.title, q.content, q.created_at, q.updated_at, u.user_id, u.first_name, u.last_name
  `;
  const rows = await safeExecute(sql, questionIds);
  
  // Index rows by ID for O(1) retrieval during mapping
  const rowById = new Map(rows.map(row => [row.id, row]));
  
  // Reconstruct the sorted array with structured JSON objects and similarity scores
  return rankedMatches
    .map(match => {
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
        author: { id: row.authorId, firstName: row.authorFirstName, lastName: row.authorLastName },
        score: scoreByQuestionId.get(match.questionId),
      };
    })
    .filter(Boolean); // Clear out null gaps from missing or deleted records
};

// Main Service: Core orchestration logic for vector similarity recommendation
export const getSimilarQuestionsService = async ({ questionHash, k = DEFAULT_K, threshold = DEFAULT_THRESHOLD }) => {
  // 1. Fetch the target source question and its embedding vector
  const sourceSql = `
    SELECT q.question_id, q.question_hash, qv.embedding
    FROM questions q
    INNER JOIN question_vectors qv ON q.question_id = qv.question_id
    WHERE q.question_hash = ? AND qv.status = 'ready'
    LIMIT 1
  `;
  const sourceRows = await safeExecute(sourceSql, [questionHash]);
  if (sourceRows.length === 0) {
    throw new NotFoundError('Question not found or vector not ready');
  }

  const sourceQuestion = sourceRows[0];
  const sourceVector = parseEmbedding(sourceQuestion.embedding);
  
  // 2. Load candidate vector space excluding the source question
  const vectorRows = await fetchAllReadyVectors(sourceQuestion.question_id);
  
  // 3. Compute vector scores, filter by threshold, sort, and slice to limit (k)
  const scoredMatches = rankVectorsBySimilarity(sourceVector, vectorRows, {
    k,
    threshold,
    excludeQuestionId: sourceQuestion.question_id,
  });

  // 4. Map similarity scores for rapid hydrate assignment
  const scoreByQuestionId = new Map(scoredMatches.map(match => [match.questionId, match.score]));
  const data = await hydrateQuestionsByIds(scoredMatches, scoreByQuestionId);

  // 5. Structure payload return along with metadata configurations
  return {
    data,
    meta: { total: data.length, k, threshold, query: null, questionHash },
  };
};