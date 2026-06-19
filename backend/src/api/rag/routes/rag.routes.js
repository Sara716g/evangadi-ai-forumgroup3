import express from "express";
import { authenticateUser } from "../../../middleware/authentication.js";
import { validationErrorHandler } from "../../../middleware/validation-handler.js";
import { documentIdParamValidation } from "../validations/rag.validation.js";
import { deleteDocumentController } from "../controller/rag.controller.js";

const router = express.Router();

// DELETE /api/rag/documents/:documentId

router.delete(
  "/documents/:documentId",
  authenticateUser,
  documentIdParamValidation,
  deleteDocumentController,
);

export default router;
