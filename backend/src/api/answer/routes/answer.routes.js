import express from 'express';
import { authenticateUser } from '../../../middleware/authentication.js';
import { validationErrorHandler } from '../../../middleware/validation-handler.js';
import { createAnswerValidation } from '../validations/answer.validation.js';
import { createAnswerController } from '../controller/answer.controller.js';
import { toggleAnswerVoteController } from '../controller/answerVote.controller.js';
import { getAnswerCommentsController, createAnswerCommentController } from '../controller/answerComment.controller.js';

const router = express.Router();

router.use(authenticateUser);
router.post('/', createAnswerValidation, validationErrorHandler, createAnswerController);
router.post('/:answerId/vote', toggleAnswerVoteController);
router.get('/:answerId/comments', getAnswerCommentsController);
router.post('/:answerId/comments', createAnswerCommentController);

export default router;
