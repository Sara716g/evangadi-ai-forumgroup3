import express from "express";
import {
  createDocumentController,
  getDocumentsController,
  searchInDocumentController,
} from "../controller/rag.controller.js";

import {
  createDocumentMulterErrorHandler,
  uploadDocument,
} from "../validations/rag.upload.config.js";

import { searchInDocumentValidation } from "../validations/rag.validation.js";
import { authenticateUser } from "../../../middleware/authentication.js";
import { validateRequest } from "../../../middleware/validateRequest.js";

const router = express.Router();

router.get("/documents", authenticateUser, getDocumentsController);

router.post(
  "/documents",
  authenticateUser,
  uploadDocument.single("file"),
  createDocumentMulterErrorHandler,
  createDocumentController
);

// T-23 ROUTE
router.get(
  "/documents/:documentId/search",
  authenticateUser,
  searchInDocumentValidation,
  validateRequest,
  searchInDocumentController
);

export default router;