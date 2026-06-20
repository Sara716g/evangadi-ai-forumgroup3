import express from 'express';
import { authenticateUser as authMiddleware } from '../../../middleware/authentication.js';
import { listDocumentsController } from '../controller/rag.controller.js';

const router = express.Router();

// GET /api/rag/documents - Protected route to list user's documents
router.get('/documents', authMiddleware, listDocumentsController);

export default router;

