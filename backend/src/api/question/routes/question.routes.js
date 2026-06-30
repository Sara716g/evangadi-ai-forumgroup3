/**
 * @file Question API routes.
 *
 * All routes require JWT authentication (authenticateUser middleware).
 * Each route uses express-validator for input validation and the
 * validationErrorHandler to convert validation errors into JSON responses.
 */

import express from 'express';
import { authenticateUser } from '../../../middleware/authentication.js';
import { validationErrorHandler } from '../../../middleware/validation-handler.js';
import {
  createQuestionValidation,
  getQuestionsValidation,
  getSingleQuestionValidation,
  searchQuestionsValidation,
  getSimilarQuestionsValidation,
  generateQuestionDraftCoachValidation,
  assessAnswerFitValidation,
} from '../validations/question.validation.js';
import {
  createQuestionController,
  getQuestionsController,
  getSingleQuestionController,
  searchQuestionsController,
  getSimilarQuestionsController,
  generateQuestionDraftCoachController,
  assessAnswerAgainstQuestionController,
} from '../controller/question.controller.js';

const router = express.Router();

/** Require authentication for all question routes. */
router.use(authenticateUser);

/** POST /api/questions — Create a new question (with duplicate detection via vector similarity). */
router.post('/', createQuestionValidation, validationErrorHandler, createQuestionController);

/** POST /api/questions/draft-coach — AI-powered feedback on a question draft. */
router.post('/draft-coach', generateQuestionDraftCoachValidation, validationErrorHandler, generateQuestionDraftCoachController);

/** POST /api/questions/:questionHash/answer-fit — Evaluate how well an answer fits a question. */
router.post('/:questionHash/answer-fit', assessAnswerFitValidation, validationErrorHandler, assessAnswerAgainstQuestionController);

/** GET /api/questions — List questions with optional keyword search and "mine" filter. */
router.get('/', getQuestionsValidation, validationErrorHandler, getQuestionsController);

/** GET /api/questions/search — Semantic search using vector cosine similarity. */
router.get('/search', searchQuestionsValidation, validationErrorHandler, searchQuestionsController);

/** GET /api/questions/:questionHash/similar — Recommend questions similar to a given one. */
router.get('/:questionHash/similar', getSimilarQuestionsValidation, validationErrorHandler, getSimilarQuestionsController);

/** GET /api/questions/:questionHash — Fetch a single question with its answers. */
router.get('/:questionHash', getSingleQuestionValidation, validationErrorHandler, getSingleQuestionController);

export default router;