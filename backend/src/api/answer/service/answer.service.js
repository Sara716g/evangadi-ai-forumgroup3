/**
 * ============================================================================
 * Domain: Core Forum (Blue Domain)
 * ============================================================================
 * Pure transactional logic for answers.
 * Deliberately avoids AI logic to maintain clean domain boundaries.
 * All answers are subject to semantic evaluation via separate AI services.
 *
 * Attachments:
 * - An answer may have zero or more attachments (images and/or PDFs).
 * - Files live on disk under uploads/answers/<userId>/<filename>.
 * - Metadata (path, mime type, type, size) lives in `answer_attachments`.
 * ============================================================================
 */

import path from 'path';
import fs from 'fs/promises';
import { safeExecute } from '../../../../db/config.js';
import { BadRequestError, NotFoundError } from '../../../utils/errors/index.js';
import { classifyAttachmentType } from '../config/answer.upload.config.js';
import { createNotification, groupNewAnswerNotification } from '../../notification/service/notification.service.js';

const UPLOAD_BASE_DIR = path.resolve(process.cwd(), 'uploads', 'answers');

const mapAttachmentRow = row => ({
  id: row.attachment_id,
  answerId: row.answer_id,
  type: row.file_type, // 'image' | 'pdf'
  originalName: row.original_name,
  mimeType: row.mime_type,
  byteSize: Number(row.byte_size),
  url: `/api/answers/attachments/${row.attachment_id}`,
  createdAt: row.created_at,
});

const insertAttachmentsForAnswer = async ({ answerId, userId, files }) => {
  if (!files || files.length === 0) {
    return [];
  }

  const insertSql = `
    INSERT INTO answer_attachments
      (answer_id, file_type, original_name, mime_type, storage_path, byte_size)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING attachment_id
  `;

  const inserted = [];
  for (const file of files) {
    const fileType = classifyAttachmentType(file.mimetype);
    const storagePath = path.join(String(userId), file.filename);

    const result = await safeExecute(insertSql, [
      answerId,
      fileType,
      file.originalname,
      file.mimetype,
      storagePath,
      file.size,
    ]);

    inserted.push({
      attachment_id: result[0].attachment_id,
      answer_id: answerId,
      file_type: fileType,
      original_name: file.originalname,
      mime_type: file.mimetype,
      storage_path: storagePath,
      byte_size: file.size,
      created_at: new Date().toISOString(),
    });
  }

  return inserted;
};

export const getAttachmentsForAnswerIds = async answerIds => {
  if (!answerIds || answerIds.length === 0) {
    return new Map();
  }

  const placeholders = answerIds.map((_, i) => '$' + (i + 1)).join(',');
  const sql = `
    SELECT
      attachment_id, answer_id, file_type, original_name,
      mime_type, storage_path, byte_size, created_at
    FROM answer_attachments
    WHERE answer_id IN (${placeholders})
    ORDER BY created_at ASC
  `;

  const rows = await safeExecute(sql, answerIds);
  const byAnswerId = new Map();

  for (const row of rows) {
    const mapped = mapAttachmentRow(row);
    if (!byAnswerId.has(row.answer_id)) {
      byAnswerId.set(row.answer_id, []);
    }
    byAnswerId.get(row.answer_id).push(mapped);
  }

  return byAnswerId;
};

export const createAnswerService = async ({ userId, questionId, content, files = [] }) => {
  const questionSql = 'SELECT question_id, user_id, question_hash FROM questions WHERE question_id = $1 LIMIT 1';
  const questionRows = await safeExecute(questionSql, [questionId]);

  if (questionRows.length === 0) {
    throw new NotFoundError('Question not found');
  }

  const question = questionRows[0];
  if (question.user_id === userId) {
    throw new BadRequestError('You cannot answer your own question.');
  }

  // When posting with files only (no text), use a placeholder so the NOT NULL constraint is satisfied.
  const answerContent = (content && content.trim()) || (files.length > 0 ? '(See attachment)' : '');

  const insertSql = 'INSERT INTO answers (question_id, user_id, content) VALUES ($1, $2, $3) RETURNING answer_id';
  const insertResult = await safeExecute(insertSql, [questionId, userId, answerContent]);
  const answerId = insertResult[0].answer_id;

  const attachmentRows = await insertAttachmentsForAnswer({ answerId, userId, files });

  // Notify question owner (grouped: "N people answered your question")
  try {
    if (question.user_id !== userId) {
      await groupNewAnswerNotification({
        userId: question.user_id,
        questionId,
        questionHash: question.question_hash,
        answerId,
      });
    }
  } catch (err) {
    console.error('Failed to create notification:', err);
  }

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
    WHERE a.answer_id = $1
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
    attachments: attachmentRows.map(mapAttachmentRow),
  };
};

export const getAnswerAttachmentFileService = async ({ attachmentId }) => {
  const sql = `
    SELECT attachment_id, original_name, mime_type, storage_path
    FROM answer_attachments
    WHERE attachment_id = $1
    LIMIT 1
  `;

  const rows = await safeExecute(sql, [attachmentId]);
  if (rows.length === 0) {
    throw new NotFoundError('Attachment not found');
  }

  const row = rows[0];
  const filePath = path.join(UPLOAD_BASE_DIR, row.storage_path);

  return {
    filePath,
    mimeType: row.mime_type,
    originalName: row.original_name,
  };
};

export const deleteAnswerAttachmentService = async ({ attachmentId, userId }) => {
  const sql = `
    SELECT aa.attachment_id, aa.storage_path, a.user_id AS answer_owner_id
    FROM answer_attachments aa
    JOIN answers a ON aa.answer_id = a.answer_id
    WHERE aa.attachment_id = $1
    LIMIT 1
  `;

  const rows = await safeExecute(sql, [attachmentId]);
  if (rows.length === 0) {
    throw new NotFoundError('Attachment not found');
  }

  const row = rows[0];
  if (row.answer_owner_id !== userId) {
    throw new BadRequestError('You can only remove attachments from your own answer.');
  }

  const absolutePath = path.join(UPLOAD_BASE_DIR, row.storage_path);

  try {
    await fs.unlink(absolutePath);
  } catch (error) {
    // File may already be missing on disk; proceed with removing the DB record.
  }

  await safeExecute('DELETE FROM answer_attachments WHERE attachment_id = $1', [attachmentId]);
  return { id: attachmentId };
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
    sql += ' WHERE a.question_id = $1';
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
    WHERE a.user_id = $1
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
