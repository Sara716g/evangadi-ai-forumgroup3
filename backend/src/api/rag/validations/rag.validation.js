import { param } from "express-validator";
import { validationErrorHandler } from "../../../middleware/validation-handler.js";

const documentIdParamOnly = [
  param("documentId")
    .isInt({ min: 1 })
    .withMessage("documentId must be a valid/positive integer.")
    .toInt(),
];

export const documentIdParamValidation = [
  ...documentIdParamOnly,
  validationErrorHandler,
];
