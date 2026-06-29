import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  registerController,
  loginController,
  verifyEmailController,
  resendVerificationController,
} from '../controller/auth.controller.js';
import {
  forgotPasswordController,
  verifyResetCodeController,
} from '../controller/forgot-password.controller.js';
import { resetPasswordController } from '../controller/reset-password.controller.js';
import {
  registerValidation,
  loginValidation,
  verifyEmailValidation,
  resendVerificationValidation,
  forgotPasswordValidation,
  verifyResetCodeValidation,
  resetPasswordValidation,
} from '../validations/auth.validation.js';

const router = express.Router();

// Rate limiters
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: {
    success: false,
    message: 'Too many registration attempts. Please try again in 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: {
    success: false,
    message: 'Too many password reset requests. Please try again in 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const verifyCodeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
  message: {
    success: false,
    message: 'Too many verification attempts. Please try again in 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * @route POST /api/auth/register
 * @desc Create a new user account (validates email via MX record, sends verification code)
 * @access Public
 */
router.post('/register', registerLimiter, registerValidation, registerController);

/**
 * @route POST /api/auth/verify-email
 * @desc Verify email address using 6-digit OTP code
 * @access Public
 */
router.post('/verify-email', verifyCodeLimiter, verifyEmailValidation, verifyEmailController);

/**
 * @route POST /api/auth/resend-verification
 * @desc Resend email verification code
 * @access Public
 */
router.post('/resend-verification', verifyCodeLimiter, resendVerificationValidation, resendVerificationController);

/**
 * @route POST /api/auth/login
 * @desc Authenticate user and get token (requires verified email)
 * @access Public
 */
router.post('/login', loginValidation, loginController);

/**
 * @route POST /api/auth/forgot-password
 * @desc Send a password reset email to the user
 * @access Public
 */
router.post('/forgot-password', forgotPasswordLimiter, forgotPasswordValidation, forgotPasswordController);

/**
 * @route POST /api/auth/verify-reset-code
 * @desc Verify a password reset code is valid
 * @access Public
 */
router.post('/verify-reset-code', verifyCodeLimiter, verifyResetCodeValidation, verifyResetCodeController);

/**
 * @route POST /api/auth/reset-password
 * @desc Reset password using a valid token
 * @access Public
 */
router.post('/reset-password', forgotPasswordLimiter, resetPasswordValidation, resetPasswordController);

export default router;
