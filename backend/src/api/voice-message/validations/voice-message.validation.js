import { param, body } from 'express-validator';

export const messageIdParamValidation = [
  param('messageId')
    .isInt({ min: 1 })
    .withMessage('Message ID must be a valid integer.')
    .toInt(),
];

export const uploadVoiceMessageValidation = [
  body('questionId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('questionId must be a valid integer.')
    .toInt(),
  body('answerId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('answerId must be a valid integer.')
    .toInt(),
  body('duration')
    .isFloat({ min: 0 })
    .withMessage('Duration must be a positive number.')
    .toFloat(),
];
