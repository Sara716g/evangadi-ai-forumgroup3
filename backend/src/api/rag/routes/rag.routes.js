import express from "express";
import { authenticateUser } from "../../../middleware/authentication.js";
import { documentIdParamValidation } from "../validations/rag.validation.js";
import { getDocumentMetaController } from "../controller/rag.controller.js";

const router = express.Router()

/**
 * GET /api/rag/documents/:documentId
 * Protected — requires Bearer token
 */
router.get(
  "/documents/:documentId",
  documentIdParamValidation,
  authenticateUser,
  getDocumentMetaController,
);

export default router;
