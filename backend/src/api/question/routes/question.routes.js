import express from "express";

// Controllers
import { getQuestionsController } from "../controller/question.controller.js";

// Middleware
import { getQuestionsValidation } from "../validations/question.validation.js";

import { authenticateUser } from "../../../middleware/authentication.js";

const router = express.Router();

/**
 * @route   GET /api/questions
 * @desc    Get all questions; supports optional filtering
 * @query   {string}  [search] - Filter questions by title or content (SQL LIKE)
 * @query   {boolean} [mine]   - When true, return only the authenticated user's questions
 * @access  Private
 */
router.get(
  "/",
  authenticateUser,
  getQuestionsValidation,
  getQuestionsController,
);

export default router;
