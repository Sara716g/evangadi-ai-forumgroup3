import { body, param, query } from 'express-validator';

export const documentIdParamValidation = [
  param('documentId')
    .isInt({ min: 1 })
    .toInt()
    .withMessage('documentId must be a positive integer.'),
];

export const searchDocumentValidation = [
  ...documentIdParamValidation,
  query('query')
    .trim()
    .isLength({ min: 3 })
    .withMessage('Search query must be at least 3 characters long.'),
  query('k').optional().isInt({ min: 1, max: 20 }).toInt(),
];

export const queryDocumentValidation = [
  ...documentIdParamValidation,
  body('query')
    .trim()
    .isLength({ min: 3 })
    .withMessage('Query must be at least 3 characters long.'),
];
