/**
 * RAG Document Validation Module
 *
 * This module provides validation rules for the RAG document streaming endpoint.
 * Task: T-24 - Stream RAG Document PDF
 * Endpoint: GET /api/rag/documents/:documentId/file
 */

import { param } from "express-validator";
import { validationErrorHandler } from "../../../middleware/validation-handler.js";

/**
 * Validation middleware for documentId path parameter
 *
 * Step 1 of Task Flow: VALIDATE PARAM
 * - Ensures documentId is provided and is a positive integer
 * - Returns 400 Bad Request if validation fails
 *
 * @middleware
 * @returns {Array} Array of validation middleware and error handler
 */
export const documentIdParamValidation = [
  param("documentId")
    // Check that documentId parameter exists and is not empty
    .notEmpty()
    .withMessage("Document ID is required")
    // Validate that documentId is a positive integer (gt: 0 = greater than 0)
    .isInt({ gt: 0 })
    .withMessage("Document ID must be a positive integer"),
  // Centralized error handler that returns validation errors in response
  validationErrorHandler,
];
