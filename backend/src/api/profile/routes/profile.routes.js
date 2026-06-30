/**
 * @file Profile API routes.
 *
 * User profile management: view, edit, upload avatar, manage credentials.
 * All routes require JWT authentication.
 */

import express from 'express';
import { authenticateUser } from '../../../middleware/authentication.js';
import { getProfileController, getMyProfileController, updateProfileController, addCredentialController, deleteCredentialController, uploadAvatarController } from '../controller/profile.controller.js';
import { uploadAvatar, createAvatarMulterErrorHandler } from '../config/profile.upload.config.js';

const router = express.Router();

/** GET /me — Fetch the authenticated user's own profile. */
router.get('/me', authenticateUser, getMyProfileController);

/** GET /:userId — Fetch another user's public profile. */
router.get('/:userId', authenticateUser, getProfileController);

/** PUT / — Update bio and other profile fields. */
router.put('/', authenticateUser, updateProfileController);

/** POST /avatar — Upload a profile avatar image. */
router.post('/avatar', authenticateUser, uploadAvatar.single('avatar'), createAvatarMulterErrorHandler, uploadAvatarController);

/** POST /credentials — Add a credential (employment, education, location). */
router.post('/credentials', authenticateUser, addCredentialController);

/** DELETE /credentials/:credentialId — Remove a credential. */
router.delete('/credentials/:credentialId', authenticateUser, deleteCredentialController);

export default router;
