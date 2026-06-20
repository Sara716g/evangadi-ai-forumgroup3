import { param, query } from "express-validator";

export const searchInDocumentValidation = [
  param("documentId")
    .isInt({ min: 1 })
    .withMessage("Invalid documentId"),

  query("query")
    .notEmpty()
    .withMessage("query is required")
    .isString(),

  query("k")
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage("k must be between 1 and 20"),
];