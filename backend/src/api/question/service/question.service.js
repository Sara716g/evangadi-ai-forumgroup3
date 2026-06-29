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
import { getAttachmentsForAnswerIds } from '../../answer/service/answer.service.js';
import { createNotification } from '../../notification/service/notification.service.js';

const DEFAULT_RECOMMEND_THRESHOLD = Number(process.env.RECOMMEND_THRESHOLD ?? 0.75);
const DEFAULT_K = 5;

// ── SAFE JSON PARSER HELPER ──────────────────────────────────────────────────
/**
 * Safely parses stringified embedding vectors, repairing concatenated 
 * JSON tokens or accidental formatting bugs gracefully.
 */
const safeJsonParse = (str, fallback = []) => {
  if (!str) return fallback;
  if (typeof str !== 'string') return str; // Already parsed by database layer

  let cleanStr = str.trim();

  // Strip unexpected markdown code blocks if present
  if (cleanStr.startsWith("```json")) {
    cleanStr = cleanStr.replace(/^```json/, "").replace(/```$/, "").trim();
  } else if (cleanStr.startsWith("```")) {
    cleanStr = cleanStr.replace(/^```/, "").replace(/```$/, "").trim();
  }

  try {
    return JSON.parse(cleanStr);
  } catch (e) {
    try {
      // Fix back-to-back concatenated json strings (e.g., {"id":1}{"id":2})
      const structuralPatch = "[" + cleanStr.replace(/}\s*{/g, "},{") + "]";
      return JSON.parse(structuralPatch);
    } catch (secondError) {
      console.error("── [Embedding Parse Failure] ───────────────────────────────");
      console.error("Target String text context:", str);
      console.error("Exception Message:", e.message);
      console.error("────────────────────────────────────────────────────────────");
      return fallback;
    }
  }
};

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

/**
 * Handles question publishing with strict vector duplicate checking logic.
 */
export const createQuestionWithVectorService = async ({ userId, title, content }) => {
   const sourceText = `${title}\n\n${content}`;
  
  // 1. Generate the vector embedding upfront for validation
  const vector = await generateEmbedding(sourceText);
  const incomingVector = normalizeEmbedding(vector);
  
  if (incomingVector.length > 0) {
    // Prevent short selections from getting broken by MySQL default truncation boundaries
    await safeExecute("SET SESSION group_concat_max_len = 1000000;", []);

    // 2. Pull all existing ready question vectors to check for exact/near duplicates
    const rows = await safeExecute(selectReadyQuestionVectorsSql, []);
    
    // Set a strict duplicate threshold (e.g., 0.85 similarity score or 85% match)
    const DUPLICATE_THRESHOLD = 0.9;
    
    const duplicateMatch = rows
      .map(row => {
        const embedding = normalizeEmbedding(safeJsonParse(row.embedding, []));
        
        // Skip comparing against bad/un-indexed rows
        if (embedding.length === 0) return { score: 0 };

        return {
          id: row.question_id,
          title: row.title,
          questionHash: row.question_hash,
          score: cosineSimilarity(incomingVector, embedding),
        };
      })
      .filter(item => item.score >= DUPLICATE_THRESHOLD)
      .sort((a, b) => b.score - a.score)[0]; // Get the closest matching question

    // 3. If a duplicate is found, abort creation and throw a clear exception
    if (duplicateMatch && duplicateMatch.id) {
      const error = new Error("A highly similar question already exists on the forum.");
      error.statusCode = 409;
      error.code = 'DuplicateDetected';
      error.existingQuestion = {
        id: duplicateMatch.id,
        question_id: duplicateMatch.id, // Direct map fallback parameter
        title: duplicateMatch.title,
        hash: duplicateMatch.questionHash,
        questionHash: duplicateMatch.questionHash,
      };
      throw error;
    }
  }

  // 4. No Duplicate Found -> Proceed with normal insertion
  const questionHash = generateHexString(16);
  const insertSql = `INSERT INTO questions (question_hash, user_id, title, content) VALUES (?, ?, ?, ?)`;
  const insertResult = await safeExecute(insertSql, [questionHash, userId, title, content]);
  const questionId = insertResult.insertId;

  // Save the pre-computed embedding safely right away to optimize system performance
  // const sourceText = `${title}\n\n${content}`;
  // const vectorSql = `INSERT INTO question_vectors (question_id, source_text, embedding, status) VALUES (?, ?, '[]', 'pending')`;
  // await safeExecute(vectorSql, [questionId, sourceText]);
  const vectorSql = `INSERT INTO question_vectors (question_id, source_text, embedding, status) VALUES (?, ?, ?, 'ready')`;
  await safeExecute(vectorSql, [questionId, sourceText, JSON.stringify(incomingVector)]);

  // Notify all other users about the new question
  try {
    const [askerRows] = await safeExecute(
      'SELECT first_name, last_name FROM users WHERE user_id = ?',
      [userId]
    );
    const askerName = askerRows.length > 0
      ? `${askerRows[0].first_name} ${askerRows[0].last_name}`
      : 'Someone';

    const allUsers = await safeExecute(
      'SELECT user_id FROM users WHERE user_id != ?',
      [userId]
    );

    for (const u of allUsers) {
      await createNotification({
        userId: u.user_id,
        type: 'question',
        title: 'New Question',
        message: `${askerName} asked a new question "${title}"`,
        link: `/question/${questionHash}`,
      });
    }
  } catch (err) {
    console.error('Failed to create question notifications:', err);
  }

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

export const getSingleQuestionService = async ({ questionHash }) => {
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
      u.last_name
    FROM answers a
    JOIN users u ON a.user_id = u.user_id
    WHERE a.question_id = ?
    ORDER BY a.created_at ASC
  `;

  const answerRows = await safeExecute(answersSql, [question.question_id]);

  // Attach any images/PDFs uploaded with each answer.
  const answerIds = answerRows.map(row => row.answer_id);
  const attachmentsByAnswerId = await getAttachmentsForAnswerIds(answerIds);

  const answers = answerRows.map(row => ({
    ...mapAnswerRow(row),
    attachments: attachmentsByAnswerId.get(row.answer_id) || [],
  }));

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
    answers,
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
Evaluate the answer below against the question content.
Determine if the answer is "strong", "partial", or "weak":
- "strong": answer directly addresses the question with clear, accurate information
- "partial": answer is related but incomplete or misses key points
- "weak": answer is off-topic, incorrect, or insufficient

Respond with valid JSON only, no markdown. Use this exact structure:
{
  "level": "strong" or "partial" or "weak",
  "note": "A brief 1-2 sentence explanation of your assessment"
}

Question Title: ${question.title}
Question Content: ${question.content}
Answer: ${answerText}`;

  const raw = await generateText(prompt);

  // Strip markdown code fences if present
  let jsonStr = raw.trim();
  const fenceMatch = jsonStr.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (fenceMatch) {
    jsonStr = fenceMatch[1].trim();
  }

  try {
    const parsed = JSON.parse(jsonStr);
    return {
      level: ['strong', 'partial', 'weak'].includes(parsed.level) ? parsed.level : 'partial',
      note: parsed.note || '',
    };
  } catch {
    // Fallback: try to detect level from raw text
    const lower = raw.toLowerCase();
    let level = 'partial';
    if (lower.includes('strong')) level = 'strong';
    else if (lower.includes('weak')) level = 'weak';
    return { level, note: raw };
  }
};