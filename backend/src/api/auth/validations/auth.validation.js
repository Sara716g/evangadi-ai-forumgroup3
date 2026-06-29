import { body } from 'express-validator';
import { validationErrorHandler } from '../../../middleware/validation-handler.js';

export const registerValidation = [
  body('firstName')
    .notEmpty()
    .withMessage('First name is required')
    .isString()
    .withMessage('First name must be a string')
    .isLength({ min: 3 })
    .withMessage('First name must be at least 3 characters long'),
  body('lastName')
    .notEmpty()
    .withMessage('Last name is required')
    .isString()
    .withMessage('Last name must be a string')
    .isLength({ min: 3 })
    .withMessage('Last name must be at least 3 characters long'),
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('A valid email address is required')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),

  validationErrorHandler,
];

export const loginValidation = [
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('A valid email address is required')
    .normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),

  validationErrorHandler,
];

export const verifyEmailValidation = [
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('A valid email address is required')
    .normalizeEmail(),
  body('code')
    .notEmpty()
    .withMessage('Verification code is required')
    .isString()
    .withMessage('Verification code must be a string')
    .isLength({ min: 6, max: 6 })
    .withMessage('Verification code must be 6 digits'),

  validationErrorHandler,
];

export const resendVerificationValidation = [
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('A valid email address is required')
    .normalizeEmail(),

  validationErrorHandler,
];

export const forgotPasswordValidation = [
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('A valid email address is required')
    .normalizeEmail(),

  validationErrorHandler,
];

export const verifyResetCodeValidation = [
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('A valid email address is required')
    .normalizeEmail(),
  body('code')
    .notEmpty()
    .withMessage('Verification code is required')
    .isString()
    .withMessage('Verification code must be a string')
    .isLength({ min: 6, max: 6 })
    .withMessage('Verification code must be 6 digits'),

  validationErrorHandler,
];

export const resetPasswordValidation = [
  body('code')
    .notEmpty()
    .withMessage('Verification code is required')
    .isString()
    .withMessage('Verification code must be a string')
    .isLength({ min: 6, max: 6 })
    .withMessage('Verification code must be 6 digits'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),

  validationErrorHandler,
];
