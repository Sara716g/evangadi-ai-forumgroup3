import express from "express";
import authRoutes from "./auth/routes/auth.routes.js";
import questionRoutes from "./question/routes/question.routes.js";
import answerRoutes from "./answer/routes/answer.routes.js";
import ragRoutes from "./rag/routes/rag.routes.js";
import aiAssistantRoutes from "./ai-assistant/routes/ai-assistant.routes.js";

export const mainRouter = express.Router();

// Authentication routes
mainRouter.use("/auth", authRoutes);

// Question routes
mainRouter.use("/questions", questionRoutes);

// Answer routes
mainRouter.use("/answers", answerRoutes);

// RAG routes
mainRouter.use("/rag", ragRoutes);

// AI Assistant routes
mainRouter.use("/ai-assistant", aiAssistantRoutes);

export default mainRouter;
