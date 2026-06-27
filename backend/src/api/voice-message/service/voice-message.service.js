import { safeExecute } from '../../../../db/config.js';
import { NotFoundError } from '../../../utils/errors/index.js';

export const uploadVoiceMessage = async ({ userId, audioFile, duration, questionId, answerId }) => {
  const sql = `
    INSERT INTO voice_messages (user_id, file_name, file_type, file_size, duration, file_path, question_id, answer_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const result = await safeExecute(sql, [
    userId,
    audioFile.originalname,
    audioFile.mimetype,
    audioFile.size,
    duration,
    audioFile.path,
    questionId || null,
    answerId || null,
  ]);

  return {
    id: result.insertId,
    fileName: audioFile.originalname,
    fileType: audioFile.mimetype,
    fileSize: audioFile.size,
    duration,
    uploadedBy: userId,
  };
};

export const getVoiceMessageById = async (messageId) => {
  const sql = `
    SELECT voice_message_id, user_id, file_name, file_type, file_size, duration, file_path, question_id, answer_id, created_at
    FROM voice_messages
    WHERE voice_message_id = ?
  `;
  const rows = await safeExecute(sql, [messageId]);

  if (rows.length === 0) {
    throw new NotFoundError('Voice message not found.');
  }

  return rows[0];
};
