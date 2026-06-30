/**
 * @file Global Express error-handling middleware.
 *
 * Catches any error thrown or passed via next(err) in route handlers and
 * returns a consistent JSON error response. Custom application errors
 * (those with a statusCode property) are forwarded as-is; unrecognised
 * errors become 500 Internal Server Error.
 */

import { StatusCodes } from 'http-status-codes';

/**
 * Express error middleware (4-argument signature signals Express to treat
 * it as an error handler rather than a normal middleware).
 */
export const errorHandler = (err, req, res, next) => {
  console.error('API Error:', err);

  let customError = {
    statusCode: err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
    msg: err.message || 'Something went wrong try again later',
  };

  // MySQL duplicate-entry constraint (unique index violation)
  if (err?.code === 'ER_DUP_ENTRY') {
    customError.statusCode = StatusCodes.BAD_REQUEST;
    customError.msg = 'Duplicate value entered for a unique field';
  }

  const responsePayload = { msg: customError.msg };

  // Attach the existing question hash when duplicate detection triggers
  if (err?.existingQuestion) responsePayload.existingQuestion = err.existingQuestion;

  // Preserve the original error code for debugging (except the already-handled ER_DUP_ENTRY)
  if (err?.code && err?.code !== 'ER_DUP_ENTRY') responsePayload.code = err.code;

  return res.status(customError.statusCode).json(responsePayload);
};

