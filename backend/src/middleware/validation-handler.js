/**
 * @file Validation error-handling middleware.
 *
 * Placed after express-validator chains in route definitions to collect
 * any validation errors and convert them into a single BadRequestError
 * that the global error handler can format into a JSON response.
 */

import { validationResult } from 'express-validator';
import { BadRequestError } from '../utils/errors/index.js';

/**
 * Collects express-validator errors and halts the request with 400
 * if any validation rules failed.
 */
export const validationErrorHandler = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => err.msg);
    throw new BadRequestError(errorMessages.join('. '));
  }
  next();
};
