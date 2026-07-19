import { safeExecute } from '../../../../db/config.js';
import { NotFoundError } from '../../../utils/errors/index.js';

export const uploadVoiceMessage = async ({ userId, audioFile, duration, questionId, answerId }) => {
  const sql = `
    INSERT INTO voice_messages (user_id, file_name, file_type, file_size, duration, file_path, question_id, answer_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING voice_message_id
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
    id: result[0].voice_message_id,
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
    WHERE voice_message_id = $1
  `;
  const rows = await safeExecute(sql, [messageId]);

  if (rows.length === 0) {
    throw new NotFoundError('Voice message not found.');
  }

  return rows[0];
};
