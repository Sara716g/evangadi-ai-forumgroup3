import express from "express";
import { getAssistantAnswer } from "../controller/ai-assistant.controller.js";
import { authenticateUser as authMiddleware } from "../../../middleware/authentication.js";

const router = express.Router();

// POST /api/ai-assistant/answer
router.post("/answer", authMiddleware, getAssistantAnswer);

export default router;
