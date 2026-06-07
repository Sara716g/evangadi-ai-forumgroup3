import express from 'express';
import authRoutes from './auth/routes/auth.routes.js';
import questionRoutes from './questions/routes/question.routes.js';

const mainRouter = express.Router();

mainRouter.use('/auth', authRoutes);
mainRouter.use('/questions', questionRoutes);

export default mainRouter;