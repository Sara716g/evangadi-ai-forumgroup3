import fs from "fs/promises";
import path from "path";
import { safeExecute } from "../../../../db/config.js";
import { NotFoundError } from "../../../utils/errors/index.js";

/**
 * Look up a document in the database, but only return it if it belongs
 * to the given user. Returns null if not found or if the user does not own it.
 * @param {number} userId
 * @param {number} documentId
 * @returns {Promise<object|null>}
 */
async function getOwnedDocumentRow(userId, documentId) {
  const sql = `
    SELECT document_id, user_id, title, mime_type, storage_path, byte_size, status, error_message, created_at, updated_at
    FROM documents
    WHERE document_id = ? AND user_id = ?
    LIMIT 1
  `;
  const rows = await safeExecute(sql, [documentId, userId]);
  return rows[0] || null;
}

/**
 * Turn a relative file path (stored in the database, e.g. "42/abc.pdf")
 * into a full absolute path on disk.
 */
function absoluteStoragePath(relativePath) {
  return path.join(uploadRoot(), relativePath);
}

/**
 * Delete a document: verify ownership, remove the file from disk,
 * then delete the DB record. CASCADE constraints handle chunks and vectors.
 * If the file is already gone from disk (ENOENT), the error is ignored.
 * @param {number} userId - ID of the authenticated user making the request.
 * @param {number} documentId - ID of the document to delete.
 */
export const deleteDocumentService = async (userId, documentId) => {
  // check if the document exists and belongs to the user
  const row = await getOwnedDocumentRow(userId, documentId);
  if (!row) {
    throw new NotFoundError(
      "Document not found or you do not have permission to delete it.",
    );
  }

  // check the file path to construct the absolute path to the file on disk
  const abs = absoluteStoragePath(row.storage_path);

  // Delete from the database first. If this fails, the file stays on disk ,
  // which is safer than deleting the file first and then failing to delete the DB record.

  await safeExecute(
    "DELETE FROM documents WHERE document_id = ? AND user_id = ?",
    [documentId, userId],
  );

  // try to delete the file from disk, but ignore errors (e.g., if the file is already gone)
  await fs.unlink(abs).catch((err) => {});
};
