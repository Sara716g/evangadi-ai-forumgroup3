import { param, query } from 'express-validator';
import { validationErrorHandler } from '../../../middleware/validation-handler.js';

export const QUESTION_HASH_REGEX = /^[a-f0-9]{16}$/;

const optionalKValidation = query('k')
  .optional()
  .isInt({ min: 1, max: 20 })
  .withMessage('k must be an integer between 1 and 20')
  .toInt();

const optionalThresholdValidation = query('threshold')
  .optional()
  .isFloat({ min: 0, max: 1 })
  .withMessage('threshold must be a number between 0 and 1')
  .toFloat();

export const getSimilarQuestionsValidation = [
  param('questionHash')
    .matches(QUESTION_HASH_REGEX)
    .withMessage('questionHash must be a 16-character lowercase hex string'),
  optionalKValidation,
  optionalThresholdValidation,
  validationErrorHandler,
];
