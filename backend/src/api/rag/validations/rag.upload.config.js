import multer from 'multer';
import path from 'path';
import fs from 'fs';
// Change this line:
import { BadRequestError } from '../../../utils/errors/index.js';

const UPLOAD_BASE_DIR = path.resolve(process.cwd(), 'uploads', 'rag');
fs.mkdirSync(UPLOAD_BASE_DIR, { recursive: true });

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
  if (file.mimetype !== 'application/pdf') {
    cb(new BadRequestError('Only PDF files are allowed.'));
    return;
  }
  cb(null, true);
};

export const uploadDocument = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
});

export const createDocumentMulterErrorHandler = (err, req, res, next) => {
  if (!err) return next();

  // Multer errors should be converted to BadRequestError so our error
  // middleware returns a 400 with a friendly message.
  if (err instanceof multer.MulterError || err.name === 'MulterError') {
    const msg =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'File too large. Maximum allowed size is 10MB.'
        : err.message || 'File upload error.';
    return next(new BadRequestError(msg));
  }

  // Non-multer errors -> forward
  return next(err);
};
