import { body, query } from "express-validator";
import { validationErrorHandler } from "../../../middleware/validation-handler.js";

export const getQuestionsValidation = [
  query("search")
    .optional()
    .isString()
    .withMessage("Search must be a string")
    .trim(),
  query("mine")
    .optional()
    .isBoolean()
    .withMessage("mine must be a boolean")
    .toBoolean(),

  validationErrorHandler,
];
