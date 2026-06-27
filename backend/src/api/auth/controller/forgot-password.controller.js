import { StatusCodes } from 'http-status-codes';
import { forgotPasswordService } from '../service/forgot-password.service.js';

/**
 * Handles the forgot-password request.
 * Always returns a success response to prevent email enumeration.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {Promise<void>}
 */
export const forgotPasswordController = async (req, res, next) => {
  try {
    const { email } = req.body;

    await forgotPasswordService(email);

    res.status(StatusCodes.OK).json({
      success: true,
      message:
        'If an account with that email exists, a password reset link has been sent.',
    });
  } catch (error) {
    next(error);
  }
};
