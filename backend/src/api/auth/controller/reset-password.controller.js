import { StatusCodes } from 'http-status-codes';
import { resetPasswordService } from '../service/reset-password.service.js';

/**
 * Handles the password reset request using a verification code.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {Promise<void>}
 */
export const resetPasswordController = async (req, res, next) => {
  try {
    const { code, password } = req.body;

    await resetPasswordService({ code, password });

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Password has been reset successfully. You can now sign in.',
    });
  } catch (error) {
    next(error);
  }
};
