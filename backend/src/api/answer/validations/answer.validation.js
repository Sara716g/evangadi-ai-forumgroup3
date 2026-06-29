import { body, param } from 'express-validator';

export const createAnswerValidation = [
  body('questionId')
    .isInt({ min: 1 })
    .withMessage('questionId must be a valid integer.')
    .toInt(),
  body('content')
    .trim()
    .isLength({ min: 20 })
    .withMessage('Content must be at least 20 characters.'),
];

export const attachmentIdParamValidation = [
  param('attachmentId')
    .isInt({ min: 1 })
    .withMessage('attachmentId must be a valid integer.')
    .toInt(),
];