import express from "express";
import {
  createDocumentController,
  getDocumentsController,
} from "../controller/rag.controller.js";
import {
  createDocumentMulterErrorHandler,
  uploadDocument,
} from "../validations/rag.upload.config.js";
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

export default router;
