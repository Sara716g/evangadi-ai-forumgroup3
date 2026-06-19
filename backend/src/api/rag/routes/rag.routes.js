/**
 * RAG Document Routes Module
 * 
 * This module defines HTTP routes for RAG document operations.
 * Task: T-24 - Stream RAG Document PDF
 * Base: /api/rag (mounted in src/api/routes.js)
 */

import express from 'express';
import { authenticateUser } from '../../../middleware/authentication.js';
import { documentIdParamValidation } from '../validations/rag.validation.js';
import { getDocumentFileController } from '../controller/rag.controller.js';

const router = express.Router();

/**
 * GET /api/rag/documents/:documentId/file
 * 
 * Stream a PDF document file to the authenticated user.
 * 
 * Route Middleware Chain (executed in order):
 * 1. authenticateUser
 *    - Validates Bearer token in Authorization header
 *    - Sets req.user.id if token is valid
 *    - Throws 401 Unauthorized if no valid token
 * 
 * 2. documentIdParamValidation
 *    - Validates :documentId parameter is a positive integer
 *    - Throws 400 Bad Request if validation fails
 * 
 * 3. getDocumentFileController
 *    - Step 2: Verify document ownership (query database)
 *    - Step 3: Resolve absolute file path
 *    - Step 4: Stream PDF file with correct headers
 * 
 * Success Response (200 OK):
 * - Content-Type: application/pdf
 * - Body: Raw PDF file stream
 * 
 * Error Responses:
 * - 401 Unauthorized: No valid Bearer token
 * - 400 Bad Request: Invalid documentId (not integer or <= 0)
 * - 404 Not Found: Document not found or user doesn't own it
 * - 500 Internal Server Error: File system or database errors
 * 
 * Example Request:
 * GET /api/rag/documents/123/file
 * Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
 * 
 * Example Usage (curl):
 * curl -H "Authorization: Bearer <token>" \
 *      http://localhost:3777/api/rag/documents/123/file \
 *      --output document.pdf
 */
router.get(
  '/documents/:documentId/file',
  // Middleware 1: Ensure user is authenticated (has valid JWT)
  authenticateUser,
  // Middleware 2: Validate documentId parameter
  documentIdParamValidation,
  // Middleware 3: Handle the actual file streaming
  getDocumentFileController,
);

export default router;
