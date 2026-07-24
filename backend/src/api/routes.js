/**
 * @file Central API router.
 *
 * Aggregates every feature-module router and mounts it under a
 * single /api prefix. Add new feature routers here as the
 * application grows.
 */

import express from "express";
import authRoutes from "./auth/routes/auth.routes.js";
import questionRoutes from "./question/routes/question.routes.js";
import answerRoutes from "./answer/routes/answer.routes.js";
import ragRoutes from "./rag/routes/rag.routes.js";
import adminRoutes from './admin/routes/admin.routes.js';
import notificationRoutes from './notification/routes/notification.routes.js';
import profileRoutes from './profile/routes/profile.routes.js';
import voiceMessageRoutes from './voice-message/routes/voice-message.routes.js';
import communityRoutes from './community/routes/community.routes.js';
import aiAssistantRoutes from "./ai-assistant/routes/ai-assistant.routes.js";

export const mainRouter = express.Router();

// --- Feature-module routers ---

/** Authentication — register, login, email verification, forgot/reset password. */
mainRouter.use("/auth", authRoutes);

/** Questions — CRUD, semantic search, draft coach, answer-fit, similar questions. */
mainRouter.use("/questions", questionRoutes);

/** Answers — create, update, delete answers + comments + votes. */
mainRouter.use("/answers", answerRoutes);

/** RAG — PDF upload, chunking, vector search, AI-grounded queries. */
mainRouter.use("/rag", ragRoutes);

/** AI Assistant — floating chat widget that answers user questions. */
mainRouter.use("/ai-assistant", aiAssistantRoutes);

/** Notifications — create, list, mark-read for user alerts. */
mainRouter.use('/notifications', notificationRoutes);

/** User profiles — get/update profile, upload avatar, credentials. */
mainRouter.use('/profile', profileRoutes);

/** Voice messages — upload and stream audio attached to questions/answers. */
mainRouter.use('/voice-messages', voiceMessageRoutes);

/** Admin — platform stats, user management, content moderation. */
mainRouter.use('/admin', adminRoutes);

/** Community — search external forums (StackOverflow, Dev.to). */
mainRouter.use('/community', communityRoutes);

export default mainRouter;
