import { param } from "express-validator";

/**
 * Validates the :documentId route parameter.
 * Must be a positive integer.
 */
export const documentIdParamValidation = [
  param("documentId")
    .exists({ checkFalsy: true })
    .withMessage("documentId param is required.")
    .isInt({ min: 1 })
    .withMessage("documentId must be a positive integer.")
    .toInt(),
];
