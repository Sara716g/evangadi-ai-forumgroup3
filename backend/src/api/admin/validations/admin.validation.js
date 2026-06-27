import { param, body, query } from 'express-validator';

export const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer.')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100.')
    .toInt(),
  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search must be at most 100 characters.'),
];

export const userIdParamValidation = [
  param('userId')
    .isInt({ min: 1 })
    .withMessage('User ID must be a valid integer.')
    .toInt(),
];

export const updateStatusValidation = [
  body('status')
    .isIn(['active', 'banned', 'suspended'])
    .withMessage('Status must be active, banned, or suspended.'),
];

export const questionHashParamValidation = [
  param('questionHash')
    .isLength({ min: 1 })
    .withMessage('Question hash is required.'),
];

export const answerIdParamValidation = [
  param('answerId')
    .isInt({ min: 1 })
    .withMessage('Answer ID must be a valid integer.')
    .toInt(),
];
