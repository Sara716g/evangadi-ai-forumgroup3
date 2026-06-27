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

router.use(authenticateUser);

router.post('/', createQuestionValidation, validationErrorHandler, createQuestionController);
router.post('/draft-coach', generateQuestionDraftCoachValidation, validationErrorHandler, generateQuestionDraftCoachController);
router.post('/:questionHash/answer-fit', assessAnswerFitValidation, validationErrorHandler, assessAnswerAgainstQuestionController);
router.get('/', getQuestionsValidation, validationErrorHandler, getQuestionsController);
router.get('/search', searchQuestionsValidation, validationErrorHandler, searchQuestionsController);
router.get('/:questionHash/similar', getSimilarQuestionsValidation, validationErrorHandler, getSimilarQuestionsController);
router.get('/:questionHash', getSingleQuestionValidation, validationErrorHandler, getSingleQuestionController);

export default router;