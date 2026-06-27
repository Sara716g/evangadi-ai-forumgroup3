import express from 'express';
import authRoutes from './auth/routes/auth.routes.js';
import questionRoutes from './question/routes/question.routes.js';
import answerRoutes from './answer/routes/answer.routes.js';
import ragRoutes from "./rag/routes/rag.routes.js";
import adminRoutes from './admin/routes/admin.routes.js';
import notificationRoutes from './notification/routes/notification.routes.js';
import profileRoutes from './profile/routes/profile.routes.js';
import voiceMessageRoutes from './voice-message/routes/voice-message.routes.js';
import communityRoutes from './community/routes/community.routes.js';

const mainRouter = express.Router();

// Authentication routes
mainRouter.use('/auth', authRoutes);

// RAG routes
mainRouter.use('/rag', ragRoutes);

// Question routes
mainRouter.use('/questions', questionRoutes);

// Answer routes
mainRouter.use('/answers', answerRoutes);

// Notification routes
mainRouter.use('/notifications', notificationRoutes);

// Profile routes
mainRouter.use('/profile', profileRoutes);

// Voice message routes
mainRouter.use('/voice-messages', voiceMessageRoutes);

// Admin routes
mainRouter.use('/admin', adminRoutes);

// Community routes
mainRouter.use('/community', communityRoutes);

export default mainRouter;
export { mainRouter };

