import { safeExecute } from '../../../../db/config.js';

export const listDocumentsForUserService = async (userId) => {
  const query = `
    SELECT document_id, title, mime_type, byte_size, status, error_message, created_at, updated_at 
    FROM documents 
    WHERE user_id = ? 
    ORDER BY created_at DESC
  `;

  const rows = await safeExecute(query, [userId]);

  // Map database snake_case columns to camelCase JSON properties as required
  return rows.map(doc => ({
    documentId: doc.document_id,
    title: doc.title,
    mimeType: doc.mime_type,
    byteSize: doc.byte_size,
    status: doc.status,
    errorMessage: doc.error_message,
    createdAt: doc.created_at,
    updatedAt: doc.updated_at
  }));
};