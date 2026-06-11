import express from 'express';
import { authenticateUser } from '../../../middleware/authentication.js';
import { validationErrorHandler } from '../../../middleware/validation-handler.js';
import { createAnswerValidation } from '../validations/answer.validation.js';
import { createAnswerController } from '../controller/answer.controller.js';

const router = express.Router();

router.use(authenticateUser);
router.post('/', createAnswerValidation, validationErrorHandler, createAnswerController);

export default router;
