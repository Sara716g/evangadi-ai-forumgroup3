/**
 * @file Answer API routes.
 *
 * All routes require JWT authentication. Supports CRUD for answers,
 * file attachments (images/PDFs), voting, and comments.
 */

import express from 'express';
import { authenticateUser } from '../../../middleware/authentication.js';
import { validationErrorHandler } from '../../../middleware/validation-handler.js';
import {
  attachmentIdParamValidation,
  createAnswerValidation,
} from '../validations/answer.validation.js';
import {
  createAnswerController,
  deleteAnswerAttachmentController,
  getAnswerAttachmentFileController,
  getAnswersController,
} from '../controller/answer.controller.js';
import {
  uploadAnswerAttachments,
  createAnswerAttachmentMulterErrorHandler,
} from '../config/answer.upload.config.js';
import { toggleAnswerVoteController } from '../controller/answerVote.controller.js';
import { getAnswerCommentsController, createAnswerCommentController } from '../controller/answerComment.controller.js';

const router = express.Router();

/** Require authentication for all answer routes. */
router.use(authenticateUser);

// List answers (optionally filtered by questionId or userId via query params).
router.get('/', getAnswersController);

// Create an answer, optionally with up to 5 image/PDF attachments ("files" field).
router.post(
  '/',
  uploadAnswerAttachments.array('files', 5),
  createAnswerAttachmentMulterErrorHandler,
  createAnswerValidation,
  validationErrorHandler,
  createAnswerController,
);

// Vote on an answer
router.post('/:answerId/vote', toggleAnswerVoteController);

// Comments
router.get('/:answerId/comments', getAnswerCommentsController);
router.post('/:answerId/comments', createAnswerCommentController);

// Stream a single attachment (image displayed inline, PDF opened inline/downloaded).
router.get(
  '/attachments/:attachmentId',
  attachmentIdParamValidation,
  validationErrorHandler,
  getAnswerAttachmentFileController,
);

// Remove an attachment (only the answer's author can do this).
router.delete(
  '/attachments/:attachmentId',
  attachmentIdParamValidation,
  validationErrorHandler,
  deleteAnswerAttachmentController,
);

export default router;
