import { safeExecute } from '../../../../db/config.js';
import { NotFoundError, BadRequestError } from '../../../utils/errors/index.js';

export const getAnswerCommentsService = async ({ answerId }) => {
  const answerSql = 'SELECT answer_id FROM answers WHERE answer_id = ? LIMIT 1';
  const answerRows = await safeExecute(answerSql, [answerId]);

  if (answerRows.length === 0) {
    throw new NotFoundError('Answer not found');
  }

  const sql = `
    SELECT
      c.comment_id,
      c.content,
      c.created_at,
      u.user_id AS author_id,
      u.first_name,
      u.last_name
    FROM answer_comments c
    JOIN users u ON c.user_id = u.user_id
    WHERE c.answer_id = ?
    ORDER BY c.created_at ASC
  `;

  const rows = await safeExecute(sql, [answerId]);

  return rows.map((row) => ({
    id: row.comment_id,
    content: row.content,
    createdAt: row.created_at,
    author: {
      id: row.author_id,
      firstName: row.first_name,
      lastName: row.last_name,
    },
  }));
};

export const createAnswerCommentService = async ({ answerId, userId, content }) => {
  const answerSql = 'SELECT answer_id FROM answers WHERE answer_id = ? LIMIT 1';
  const answerRows = await safeExecute(answerSql, [answerId]);

  if (answerRows.length === 0) {
    throw new NotFoundError('Answer not found');
  }

  if (!content || content.trim().length === 0) {
    throw new BadRequestError('Comment content cannot be empty.');
  }

  const insertSql = 'INSERT INTO answer_comments (answer_id, user_id, content) VALUES (?, ?, ?)';
  const insertResult = await safeExecute(insertSql, [answerId, userId, content.trim()]);
  const commentId = insertResult.insertId;

  const fetchSql = `
    SELECT
      c.comment_id,
      c.content,
      c.created_at,
      u.user_id AS author_id,
      u.first_name,
      u.last_name
    FROM answer_comments c
    JOIN users u ON c.user_id = u.user_id
    WHERE c.comment_id = ?
    LIMIT 1
  `;

  const rows = await safeExecute(fetchSql, [commentId]);
  const row = rows[0];

  return {
    id: row.comment_id,
    content: row.content,
    createdAt: row.created_at,
    author: {
      id: row.author_id,
      firstName: row.first_name,
      lastName: row.last_name,
    },
  };
};
