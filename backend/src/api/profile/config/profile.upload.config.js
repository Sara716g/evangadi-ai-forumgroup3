import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { BadRequestError } from '../../../utils/errors/index.js';

const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads', 'avatars');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${req.user.id}-${Date.now()}${ext}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowed.includes(file.mimetype)) {
    cb(new BadRequestError('Only JPEG, PNG, GIF, and WebP images are allowed.'));
    return;
  }
  cb(null, true);
};

export const uploadAvatar = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const createAvatarMulterErrorHandler = (err, req, res, next) => {
  if (!err) return next();
  if (err instanceof multer.MulterError || err.name === 'MulterError') {
    const msg =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'Image too large. Maximum allowed size is 5MB.'
        : err.message || 'Image upload error.';
    return next(new BadRequestError(msg));
  }
  return next(err);
};
