import { body, param, query } from "express-validator";
import { validationErrorHandler } from "../../../middleware/validation-handler.js";

// =========================
// REGEX
// =========================
export const QUESTION_HASH_REGEX = /^[a-f0-9]{16}$/;

// =========================
// CREATE QUESTION VALIDATION
// =========================
export const createQuestionValidation = [
  body("title")
    .notEmpty()
    .withMessage("Title is required")
    .isString()
    .withMessage("Title must be a string")
    .isLength({ min: 5 })
    .withMessage("Title must be at least 5 characters long")
    .isLength({ max: 255 })
    .withMessage("Title must be no more than 255 characters long")
    .trim(),

  body("content")
    .notEmpty()
    .withMessage("Content is required")
    .isString()
    .withMessage("Content must be a string")
    .isLength({ min: 10 })
    .withMessage("Content must be at least 10 characters long")
    .trim(),
];

// =========================
// SIMILAR QUESTIONS VALIDATION
// =========================
const optionalKValidation = query("k")
  .optional()
  .isInt({ min: 1, max: 20 })
  .withMessage("k must be an integer between 1 and 20")
  .toInt();

const optionalThresholdValidation = query("threshold")
  .optional()
  .isFloat({ min: 0, max: 1 })
  .withMessage("threshold must be a number between 0 and 1")
  .toFloat();

export const getSimilarQuestionsValidation = [
  param("questionHash")
    .matches(QUESTION_HASH_REGEX)
    .withMessage("questionHash must be a 16-character lowercase hex string"),

  optionalKValidation,
  optionalThresholdValidation,

  validationErrorHandler,
];

// =========================
// SINGLE QUESTION VALIDATION
// =========================
export const getSingleQuestionValidation = [
  param("questionHash")
    .matches(QUESTION_HASH_REGEX)
    .withMessage("questionHash must be a 16-character lowercase hex string"),

  validationErrorHandler,
];