import { StatusCodes } from 'http-status-codes';
import { registerService, loginService } from '../service/auth.service.js';

/**
 * Handles user registration — validates email, creates account, returns token.
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
      message: 'Account created successfully.',
      user: result.user,
      token: result.token,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles user login requests.
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
