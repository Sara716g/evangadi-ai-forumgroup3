import express from 'express';
import { authenticateUser } from '../../../middleware/authentication.js';
import { generateQuestionDraftCoachValidation } from '../validations/question.validation.js';
import { generateQuestionDraftCoachController } from '../controller/question.controller.js';

const router = express.Router();

router.post(
  '/draft-coach',
  authenticateUser,
  generateQuestionDraftCoachValidation,
  generateQuestionDraftCoachController
);

export default router;