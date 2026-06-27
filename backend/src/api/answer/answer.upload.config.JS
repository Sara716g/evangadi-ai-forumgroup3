import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { BadRequestError } from '../../utils/errors/index.js';

const UPLOAD_BASE_DIR = path.resolve(process.cwd(), 'uploads', 'answers');
fs.mkdirSync(UPLOAD_BASE_DIR, { recursive: true });

const ALLOWED_IMAGE_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
const ALLOWED_PDF_MIME_TYPE = 'application/pdf';
const ALLOWED_MIME_TYPES = [...ALLOWED_IMAGE_MIME_TYPES, ALLOWED_PDF_MIME_TYPE];

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB per file
const MAX_FILES_PER_ANSWER = 5;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userId = req.user?.id || 'anonymous';
    const userDir = path.join(UPLOAD_BASE_DIR, String(userId));
    fs.mkdirSync(userDir, { recursive: true });
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(new BadRequestError('Only image (PNG, JPEG, WEBP, GIF) and PDF files are allowed.'));
    return;
  }
  cb(null, true);
};

export const uploadAnswerAttachments = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: MAX_FILES_PER_ANSWER,
  },
});

export const classifyAttachmentType = mimeType =>
  mimeType === ALLOWED_PDF_MIME_TYPE ? 'pdf' : 'image';

export const createAnswerAttachmentMulterErrorHandler = (err, req, res, next) => {
  if (!err) {
    return next();
  }

  if (err instanceof multer.MulterError || err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      throw new BadRequestError('Each file must be 10MB or smaller.');
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      throw new BadRequestError(`You can attach up to ${MAX_FILES_PER_ANSWER} files per answer.`);
    }
    throw new BadRequestError(err.message);
  }

  throw err;
};