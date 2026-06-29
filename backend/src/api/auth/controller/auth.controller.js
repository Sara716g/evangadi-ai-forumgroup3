import { StatusCodes } from 'http-status-codes';
import {
  registerService,
  loginService,
  verifyEmailService,
  resendVerificationService,
} from '../service/auth.service.js';

/**
 * Handles user registration — validates email, creates account as unverified, returns info.
 */
export const registerController = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    const result = await registerService({
      firstName,
      lastName,
      email,
      password,
    });

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: result.message,
      user: result.user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles email verification — verifies OTP, marks user verified, returns token.
 */
export const verifyEmailController = async (req, res, next) => {
  try {
    const { email, code } = req.body;

    const result = await verifyEmailService({ email, code });

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Email verified successfully.',
      user: result.user,
      token: result.token,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles resending verification email — generates new code and sends it.
 */
export const resendVerificationController = async (req, res, next) => {
  try {
    const { email } = req.body;

    await resendVerificationService(email);

    res.status(StatusCodes.OK).json({
      success: true,
      message:
        'If an account with that email exists, a new verification code has been sent.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles user login requests. Checks email verification status.
 */
export const loginController = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const authResult = await loginService({ email, password });

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Login successful.',
      user: authResult.user,
      token: authResult.token,
    });
  } catch (error) {
    next(error);
  }
};
