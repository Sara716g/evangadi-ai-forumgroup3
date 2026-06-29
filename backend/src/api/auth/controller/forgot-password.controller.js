import { StatusCodes } from 'http-status-codes';
import {
  forgotPasswordService,
  verifyResetCodeService,
} from '../service/forgot-password.service.js';

/**
 * Handles the forgot-password request.
 * Always returns a success response to prevent email enumeration.
 */
export const forgotPasswordController = async (req, res, next) => {
  try {
    const { email } = req.body;

    await forgotPasswordService(email);

    res.status(StatusCodes.OK).json({
      success: true,
      message:
        'If an account with that email exists, a password reset code has been sent.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles verifying a password reset code.
 * Returns success if the code is valid and not expired.
 */
export const verifyResetCodeController = async (req, res, next) => {
  try {
    const { email, code } = req.body;

    const result = await verifyResetCodeService({ email, code });

    res.status(StatusCodes.OK).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};
