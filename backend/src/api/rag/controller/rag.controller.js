/**
 * RAG Document Controller Module
 * 
 * This module handles HTTP request/response for streaming RAG documents.
 * Task: T-24 - Stream RAG Document PDF
 * Endpoint: GET /api/rag/documents/:documentId/file
 */

import fs from 'fs/promises';
import path from 'path';
import { assertOwnedDocument } from '../services/rag.service.js';

/**
 * Stream a PDF document file to the client
 * 
 * Complete Task Flow Implementation:
 * Step 1: VALIDATE PARAM - ✓ Handled by documentIdParamValidation middleware
 * Step 2: CHECK OWNERSHIP - ✓ Verify document belongs to authenticated user
 * Step 3: GET PATH - ✓ Retrieve storage_path from database and resolve to absolute path
 * Step 4: STREAM FILE - ✓ Use res.sendFile() with Content-Type: application/pdf
 * 
 * Security Measures:
 * - Path traversal protection: Validates that resolved path is within RAG_UPLOAD_DIR
 * - File existence check: Uses fs.access() before streaming
 * - User ownership verification: Only stream if user owns the document
 * 
 * @async
 * @param {Object} req - Express request object
 *   - req.params.documentId: Document ID (validated as positive integer)
 *   - req.user.id: Authenticated user ID (from JWT in Bearer token)
 * @param {Object} res - Express response object
 * @param {Function} next - Express error handler callback
 * @returns {void}
 * 
 * Response (Success 200):
 * - Content-Type: application/pdf
 * - Body: Raw PDF file stream
 * - Browser: Renders PDF inline or prompts download
 * 
 * Response (Error 404):
 * - Returns 404 if document not found or user doesn't own it
 * 
 * Response (Error 400/500):
 * - Returns 400 if documentId invalid (validation middleware)
 * - Returns 500 if file system error
 */
export const getDocumentFileController = async (req, res, next) => {
  try {
    // STEP 1: VALIDATE PARAM (done by middleware - documentId is guaranteed to be positive integer)
    const documentId = Number(req.params.documentId);
    // Extract user ID from JWT token (set by authenticateUser middleware)
    const userId = req.user?.id;

    // STEP 2: CHECK OWNERSHIP
    // Verify user owns this document and retrieve storage_path and mime_type
    // Throws NotFoundError(404) if document doesn't exist or user doesn't own it
    const document = await assertOwnedDocument(documentId, userId);

    // STEP 3: GET PATH - Resolve Absolute File Path
    // Get upload directory from environment variable (set in .env)
    // Default: 'uploads/rag' relative to project root
    const uploadDir = process.env.RAG_UPLOAD_DIR || 'uploads/rag';
    
    // Get the relative storage_path from database (e.g., 'user_123/document.pdf')
    // normalize() cleans up path separators (handles Windows/Linux differences)
    const storagePath = path.normalize(String(document.storage_path || ''));
    
    // Resolve upload directory to absolute path from current working directory
    const baseUploadPath = path.resolve(process.cwd(), uploadDir);
    
    // Resolve the full file path:
    // - If storagePath is absolute, use it as-is
    // - If storagePath is relative, join with baseUploadPath
    const resolvedPath = path.isAbsolute(storagePath)
      ? path.resolve(storagePath)
      : path.resolve(baseUploadPath, storagePath);

    // SECURITY: Path Traversal Protection
    // Ensure resolved path is within the allowed upload directory
    // Prevent attacks like storagePath = '../../sensitive/file.txt'
    const relativePath = path.relative(baseUploadPath, resolvedPath);
    if (relativePath.startsWith('..')) {
      throw new Error('Invalid document path');
    }

    // SECURITY: File Existence Check
    // Verify the file actually exists on disk before attempting to stream
    // Throws error if file not accessible
    await fs.access(resolvedPath);

    // STEP 4: STREAM FILE
    // Set response Content-Type to application/pdf
    // This tells the browser to render the PDF inline (not force download)
    res.type('application/pdf');
    
    // Stream the file to the client using res.sendFile()
    // This efficiently streams large files without loading entire file into memory
    // Arguments: (filepath, options, error_callback)
    return res.sendFile(resolvedPath, err => {
      // If sendFile encounters an error (e.g., file deleted mid-stream)
      if (err) {
        // Pass error to Express error handler middleware
        return next(err);
      }
      return null;
    });
  } catch (error) {
    // Catch any errors (validation, database, file system) and pass to error handler
    // Error handler will return appropriate HTTP status code
    next(error);
  }
};
