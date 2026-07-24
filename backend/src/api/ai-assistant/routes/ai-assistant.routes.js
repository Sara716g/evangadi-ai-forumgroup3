/**
 * @file AI Assistant API routes.
 *
 * Single endpoint for the floating AI chat widget that answers
 * user questions about the forum or technical topics.
 */

import express from "express";
import { getAssistantAnswer } from "../controller/ai-assistant.controller.js";
import { authenticateUser as authMiddleware } from "../../../middleware/authentication.js";

const router = express.Router();

/** POST /answer — Send a question to the AI assistant and get a response. */
router.post("/answer", authMiddleware, getAssistantAnswer);

export default router;
