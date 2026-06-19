/**
 * RAG Document Service Module
 * 
 * This module handles RAG-specific business logic, particularly document ownership verification.
 * Task: T-24 - Stream RAG Document PDF
 * Endpoint: GET /api/rag/documents/:documentId/file
 */

import { safeExecute } from '../../../../db/config.js';
import { NotFoundError } from '../../../utils/errors/index.js';

/**
 * Verify document ownership and retrieve metadata
 * 
 * Step 2 of Task Flow: CHECK OWNERSHIP
 * - Queries the 'documents' table from database schema (schema.sql)
 * - Verifies that documentId belongs to the authenticated user (user_id match)
 * - Returns 404 Not Found if document doesn't exist or user doesn't own it
 * - Retrieved storage_path is later resolved to absolute file path
 * 
 * @async
 * @param {number} documentId - The document ID from URL parameter (:documentId)
 * @param {number} userId - The authenticated user's ID from JWT token (req.user.id)
 * @returns {Promise<Object>} Document object with { document_id, storage_path, mime_type }
 * @throws {NotFoundError} Throws 404 if document not found or not owned by user
 * 
 * Database Schema Reference:
 * - Table: documents
 * - Columns: document_id (INT), user_id (INT), storage_path (VARCHAR), mime_type (VARCHAR)
 * - Foreign Key: user_id references users(user_id)
 */
export const assertOwnedDocument = async (documentId, userId) => {
  // SQL query with two WHERE conditions:
  // 1. document_id = ? (matches the requested document)
  // 2. user_id = ? (ensures user owns this document)
  const sql = `
    SELECT document_id, storage_path, mime_type
    FROM documents
    WHERE document_id = ? AND user_id = ?
    LIMIT 1
  `;

  // Execute parameterized query (safe against SQL injection)
  const rows = await safeExecute(sql, [documentId, userId]);

  // If no rows returned, document doesn't exist or user doesn't own it
  if (!rows.length) {
    throw new NotFoundError('Document not found');
  }

  // Return document metadata (includes storage_path needed for file streaming)
  return rows[0];
};
