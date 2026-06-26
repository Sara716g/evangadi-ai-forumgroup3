/**
 * ============================================================================
 * Domain: Core Forum (Blue Domain)
 * ============================================================================
 * Pure transactional logic for answers.
 * Deliberately avoids AI logic to maintain clean domain boundaries.
 * All answers are subject to semantic evaluation via separate AI services.
 * ============================================================================
 */

import { safeExecute } from '../../../../db/config.js';
import { BadRequestError, NotFoundError } from '../../../utils/errors/index.js';

export const createAnswerService = async ({ userId, questionId, content }) => {
  const questionSql = 'SELECT question_id, user_id FROM questions WHERE question_id = ? LIMIT 1';
  const questionRows = await safeExecute(questionSql, [questionId]);

  if (questionRows.length === 0) {
    throw new NotFoundError('Question not found');
  }

  const question = questionRows[0];
  if (question.user_id === userId) {
    throw new BadRequestError('You cannot answer your own question.');
  }

  const insertSql = 'INSERT INTO answers (question_id, user_id, content) VALUES (?, ?, ?)';
  const insertResult = await safeExecute(insertSql, [questionId, userId, content]);
  const answerId = insertResult.insertId;

  const fetchSql = `
    SELECT
      a.answer_id,
      a.question_id,
      a.content,
      a.created_at,
      a.updated_at,
      u.user_id AS author_id,
      u.first_name,
      u.last_name
    FROM answers a
    JOIN users u ON a.user_id = u.user_id
    WHERE a.answer_id = ?
    LIMIT 1
  `;

  const rows = await safeExecute(fetchSql, [answerId]);
  if (rows.length === 0) {
    throw new Error('Failed to retrieve the created answer.');
  }

  const row = rows[0];
  return {
    id: row.answer_id,
    questionId: row.question_id,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    author: {
      id: row.author_id,
      firstName: row.first_name,
      lastName: row.last_name,
    },
  };
};

export const getAnswersService = async (questionId) => {
  let sql = `
    SELECT
      a.answer_id,
      a.question_id,
      a.content,
      a.created_at,
      a.updated_at,
      u.user_id AS author_id,
      u.first_name,
      u.last_name,
      q.question_hash
    FROM answers a
    JOIN users u ON a.user_id = u.user_id
    LEFT JOIN questions q ON a.question_id = q.question_id
  `;
  const params = [];
  if (questionId) {
    sql += ' WHERE a.question_id = ?';
    params.push(questionId);
  }
  sql += ' ORDER BY a.created_at DESC';
  const rows = await safeExecute(sql, params);
  return rows.map(row => ({
    id: row.answer_id,
    answerId: row.answer_id,
    questionId: row.question_id,
    questionHash: row.question_hash,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    author: {
      id: row.author_id,
      firstName: row.first_name,
      lastName: row.last_name,
    },
  }));
};

export const getUserAnswersService = async (userId) => {
  const sql = `
    SELECT
      a.answer_id,
      a.question_id,
      a.content,
      a.created_at,
      a.updated_at,
      u.user_id AS author_id,
      u.first_name,
      u.last_name,
      q.question_hash
    FROM answers a
    JOIN users u ON a.user_id = u.user_id
    LEFT JOIN questions q ON a.question_id = q.question_id
    WHERE a.user_id = ?
    ORDER BY a.created_at DESC
  `;
  const rows = await safeExecute(sql, [userId]);
  return rows.map(row => ({
    id: row.answer_id,
    answerId: row.answer_id,
    questionId: row.question_id,
    questionHash: row.question_hash,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    author: {
      id: row.author_id,
      firstName: row.first_name,
      lastName: row.last_name,
    },
  }));
};
