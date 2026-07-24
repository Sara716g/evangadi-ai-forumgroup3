import { body, param } from 'express-validator';

export const createAnswerValidation = [
  body('questionId')
    .isInt({ min: 1 })
    .withMessage('questionId must be a valid integer.')
    .toInt(),
  body('content')
    .trim()
    .custom((value, { req }) => {
      const hasFiles = req.files && req.files.length > 0;
      if (!hasFiles && value.length < 20) {
        throw new Error('Content must be at least 20 characters, or include an attachment.');
      }
      return true;
    }),
];

export const attachmentIdParamValidation = [
  param('attachmentId')
    .isInt({ min: 1 })
    .withMessage('attachmentId must be a valid integer.')
    .toInt(),
];