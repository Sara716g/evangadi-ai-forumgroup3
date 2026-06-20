import { safeExecute } from "../../../utils/db.js";

/**
 * Fetches document metadata for a given documentId,
 * ensuring the document belongs to the authenticated user.
 *
 * @param {number} documentId - The document's primary key.
 * @param {number} userId     - The authenticated user's ID.
 * @returns {Object}          - Formatted document metadata.
 * @throws {Error}            - 404 if not found or not owned by user.
 */
export const getDocumentMetaService = async (documentId, userId) => {
  const query = `
    SELECT
      document_id,
      title,
      mime_type,
      byte_size,
      status,
      error_message,
      created_at,
      updated_at,
      user_id,
      storage_path
    FROM documents
    WHERE document_id = ?
      AND user_id     = ?
    LIMIT 1
  `;

  const rows = await safeExecute(query, [documentId, userId]);

  if (!rows || rows.length === 0) {
    const err = new Error("Document not found.");
    err.statusCode = 404;
    throw err;
  }

  const doc = rows[0];

  return {
    document_id: doc.document_id,
    title: doc.title,
    mime_type: doc.mime_type,
    byte_size: doc.byte_size,
    status: doc.status,
    error_message: doc.error_message,
    created_at: doc.created_at,
    updated_at: doc.updated_at,
    user_id: doc.user_id,
    storage_path: doc.storage_path,
  };
};
