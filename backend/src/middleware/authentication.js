/**
 * @file JWT authentication middleware.
 *
 * Extracts the Bearer token from the Authorization header, verifies it
 * against JWT_SECRET, and attaches the decoded user payload to req.user
 * so downstream handlers can access the authenticated user's id, name,
 * and role without re-parsing the token.
 */

import jwt from "jsonwebtoken";
import { UnauthenticatedError } from "../utils/errors/index.js";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

/**
 * Express middleware that enforces JWT authentication.
 *
 * Expected header: `Authorization: Bearer <token>`
 *
 * On success, populates:
 *   - req.user.id
 *   - req.user.firstName
 *   - req.user.lastName
 *   - req.user.role   (used by admin middleware for authorization)
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export const authenticateUser = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication invalid",
      });
    }

    const token = authHeader.split(" ")[1];

    const payload = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: payload.id,
      firstName: payload.firstName,
      lastName: payload.lastName,
      role: payload.role,
    };
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Authentication invalid",
    });
  }
};
