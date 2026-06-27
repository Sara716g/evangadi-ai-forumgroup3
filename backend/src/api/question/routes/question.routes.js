import express from "express";
import { authenticateUser } from "../../../middleware/authentication.js";
import {
  createQuestionController,
  getSimilarQuestionsController,
  getSingleQuestionController,
  getAllQuestionsController,
} from "../controller/question.controller.js";

// Controllers
// import {
//   createQuestionController,
//   getSimilarQuestionsController,
//   getSingleQuestionController,
// } from "../controller/question.controller.js";

// Validations
import {
  createQuestionValidation,
  getSimilarQuestionsValidation,
  getSingleQuestionValidation,
} from "../validations/question.validation.js";

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
 * @desc   List/search questions (optionally filter by "mine")
 * @access Protected
 */
router.get(
  "/",
  authenticateUser,
  getAllQuestionsController,
);

/**
 * @route  GET /api/questions/:questionHash/similar
 * @desc   Get AI-based similar questions using embeddings/vector search
 * @access Protected
 */
router.get(
  "/:questionHash/similar",
  authenticateUser,
  getSimilarQuestionsValidation,
  getSimilarQuestionsController,
);

/**
 * @route  GET /api/questions/:questionHash
 * @desc   Get a single question with all of its answers (and attachments)
 * @access Protected
 */
router.get(
  "/:questionHash",
  authenticateUser,
  getSingleQuestionValidation,
  getSingleQuestionController,
);


export default router;
