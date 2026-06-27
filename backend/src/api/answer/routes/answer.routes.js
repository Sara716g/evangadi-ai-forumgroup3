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
} from '../controller/answer.controller.js';
import {
  uploadAnswerAttachments,
  createAnswerAttachmentMulterErrorHandler,
} from '../answer.upload.config.js';

const router = express.Router();

router.use(authenticateUser);

// Create an answer, optionally with up to 5 image/PDF attachments ("files" field).
router.post(
  '/',
  uploadAnswerAttachments.array('files', 5),
  createAnswerAttachmentMulterErrorHandler,
  createAnswerValidation,
  validationErrorHandler,
  createAnswerController,
);

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