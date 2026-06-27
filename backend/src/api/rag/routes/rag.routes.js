import express from "express";
import {
  createDocumentController,
  deleteDocumentController,
  getDocumentFileController,
  getDocumentMetaController,
  getDocumentsController,
  queryDocumentController,
  retryDocumentController,
  searchInDocumentController,
} from "../controller/rag.controller.js";
import {
  createDocumentMulterErrorHandler,
  uploadDocument,
} from "../config/rag.upload.config.js";
import {
  documentIdParamValidation,
  parseDocumentIdParam,
  validateQueryBody,
  validateSearchQuery,
} from "../validations/rag.validation.js";
import { authenticateUser } from "../../../middleware/authentication.js";

const router = express.Router();

router.get("/documents", authenticateUser, getDocumentsController);
router.post(
  "/documents",
  authenticateUser,
  uploadDocument.single("file"),
  createDocumentMulterErrorHandler,
  createDocumentController,
);
router.get(
  "/documents/:documentId",
  authenticateUser,
  documentIdParamValidation,
  getDocumentMetaController,
);
router.delete(
  "/documents/:documentId",
  authenticateUser,
  parseDocumentIdParam,
  deleteDocumentController,
);
router.get(
  "/documents/:documentId/search",
  authenticateUser,
  parseDocumentIdParam,
  validateSearchQuery,
  searchInDocumentController,
);
router.post(
  "/documents/:documentId/query",
  authenticateUser,
  parseDocumentIdParam,
  validateQueryBody,
  queryDocumentController,
);
router.get(
  "/documents/:documentId/file",
  authenticateUser,
  parseDocumentIdParam,
  getDocumentFileController,
);
router.post(
  "/documents/:documentId/retry",
  authenticateUser,
  parseDocumentIdParam,
  retryDocumentController,
);

export default router;
