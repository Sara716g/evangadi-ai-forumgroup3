import express from 'express';
import { authenticateUser } from '../../../middleware/authentication.js';
import { getProfileController, getMyProfileController, updateProfileController, addCredentialController, deleteCredentialController, uploadAvatarController } from '../controller/profile.controller.js';
import { uploadAvatar, createAvatarMulterErrorHandler } from '../config/profile.upload.config.js';

const router = express.Router();

router.get('/me', authenticateUser, getMyProfileController);
router.get('/:userId', authenticateUser, getProfileController);
router.put('/', authenticateUser, updateProfileController);
router.post('/avatar', authenticateUser, uploadAvatar.single('avatar'), createAvatarMulterErrorHandler, uploadAvatarController);
router.post('/credentials', authenticateUser, addCredentialController);
router.delete('/credentials/:credentialId', authenticateUser, deleteCredentialController);

export default router;
