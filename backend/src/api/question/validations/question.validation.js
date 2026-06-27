import { body, param, query } from 'express-validator';

const questionHashPattern = /^[a-f0-9]{16}$/;

export const createQuestionValidation = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 255 })
    .withMessage('Title must be between 5 and 255 characters.'),
  body('content')
    .trim()
    .isLength({ min: 10 })
    .withMessage('Content must be at least 10 characters.'),
];

export const generateQuestionDraftCoachValidation = [
  body('title').optional().trim().isLength({ min: 3 }).withMessage('Title must be at least 3 characters.'),
  body('content')
    .trim()
    .isLength({ min: 10 })
    .withMessage('Content must be at least 10 characters.'),
];

export const assessAnswerFitValidation = [
  param('questionHash')
    .matches(questionHashPattern)
    .withMessage('questionHash must be a 16-character lowercase hex string.'),
  body('answerText')
    .trim()
    .isLength({ min: 20 })
    .withMessage('Answer text must be at least 20 characters.'),
];

export const getQuestionsValidation = [
  query('search').optional().isString().trim(),
  query('mine').optional().isBoolean().toBoolean(),
];

export const getSingleQuestionValidation = [
  param('questionHash')
    .matches(questionHashPattern)
    .withMessage('questionHash must be a 16-character lowercase hex string.'),
];

export const searchQuestionsValidation = [
  query('query')
    .trim()
    .isLength({ min: 5 })
    .withMessage('Search query must be at least 5 characters long.'),
  query('k').optional().isInt({ min: 1, max: 20 }).toInt(),
  query('threshold')
    .optional()
    .isFloat({ min: 0, max: 1 })
    .toFloat(),
];

export const getSimilarQuestionsValidation = [
  param('questionHash')
    .matches(questionHashPattern)
    .withMessage('questionHash must be a 16-character lowercase hex string.'),
  query('k').optional().isInt({ min: 1, max: 20 }).toInt(),
  query('threshold')
    .optional()
    .isFloat({ min: 0, max: 1 })
    .toFloat(),
];