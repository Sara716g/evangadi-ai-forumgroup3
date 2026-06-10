import express from "express";
import {
  createQuestionController,
  getQuestionsController,
} from "../controller/question.controller.js";
import {
  createQuestionValidation,
  getQuestionsValidation,
} from "../validations/question.validation.js";
import { authenticateUser } from "../../../middleware/authentication.js";

const router = express.Router();

/**
 * @route  POST /api/questions
 * @desc   Create a new question and generate a vector embedding
 * @access Protected
 */
router.post(
  "/",
  authenticateUser,
  createQuestionValidation,
  createQuestionController,
);

/**
 * @route  GET /api/questions
 * @desc   Get all questions with optional search and mine filters
 * @access Protected
 */
router.get(
  "/",
  authenticateUser,
  getQuestionsValidation,
  getQuestionsController,
);

export default router;
