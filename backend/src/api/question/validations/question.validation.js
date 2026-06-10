import { body } from "express-validator";
import { validationErrorHandler } from "../../../middleware/validation-handler.js";

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

  validationErrorHandler,
];
