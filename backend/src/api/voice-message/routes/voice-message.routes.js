/**
 * @file Voice message API routes.
 *
 * Upload, retrieve, and stream audio messages attached to questions or answers.
 * All routes require JWT authentication.
 */

import express from 'express';
import multer from 'multer';
import path from 'path';
import { authenticateUser } from '../../../middleware/authentication.js';
import { validationErrorHandler } from '../../../middleware/validation-handler.js';
import {
  messageIdParamValidation,
  uploadVoiceMessageValidation,
} from '../validations/voice-message.validation.js';
import {
  uploadVoiceMessageController,
  getVoiceMessageController,
  streamVoiceMessageController,
} from '../controller/voice-message.controller.js';

const router = express.Router();

/** Multer storage config — saves audio files with unique timestamped names. */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.resolve('src/uploads/voice-messages'));
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

/** Only allow audio MIME types; reject everything else. */
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['audio/webm', 'audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/ogg'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only audio files are allowed.'), false);
  }
};

/** Multer upload instance with 5 MB file size limit. */
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

/** Require authentication for all voice message routes. */
router.use(authenticateUser);

/** POST / — Upload a voice message audio file. */
router.post(
  '/',
  upload.single('audio'),
  uploadVoiceMessageValidation,
  validationErrorHandler,
  uploadVoiceMessageController
);

/** GET /:messageId — Fetch voice message metadata. */
router.get(
  '/:messageId',
  messageIdParamValidation,
  validationErrorHandler,
  getVoiceMessageController
);

/** GET /:messageId/stream — Stream the audio file for playback. */
router.get(
  '/:messageId/stream',
  messageIdParamValidation,
  validationErrorHandler,
  streamVoiceMessageController
);

export default router;
