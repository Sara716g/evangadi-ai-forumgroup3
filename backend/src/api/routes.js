import express from 'express';
import authRoutes from './auth/routes/auth.routes.js';
import questionRoutes from './question/routes/question.routes.js';
import answerRoutes from './answer/routes/answer.routes.js';
import ragRouter from './rag/routes/rag.routes.js';

const router = express.Router();

// Authentication routes
router.use('/auth', authRoutes);

// Question routes
router.use('/questions', questionRoutes);

// Answer routes
router.use('/answers', answerRoutes);

// Mount your RAG routes under /api/rag
router.use('/rag', ragRouter);

export default router;
export { router as mainRouter };
