import express from 'express';
import {
  registerController,
  loginController,
} from '../controller/auth.controller.js';
import { forgotPasswordController } from '../controller/forgot-password.controller.js';
import { resetPasswordController } from '../controller/reset-password.controller.js';
import {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
} from '../validations/auth.validation.js';

const router = express.Router();

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register', registerValidation, registerController);

/**
 * @route POST /api/auth/login
 * @desc Authenticate user and get token
 * @access Public
 */
router.post('/login', loginValidation, loginController);

/**
 * @route POST /api/auth/forgot-password
 * @desc Send a password reset email to the user
 * @access Public
 */
router.post('/forgot-password', forgotPasswordValidation, forgotPasswordController);

/**
 * @route POST /api/auth/reset-password
 * @desc Reset password using a valid token
 * @access Public
 */
router.post('/reset-password', resetPasswordValidation, resetPasswordController);

export default router;
