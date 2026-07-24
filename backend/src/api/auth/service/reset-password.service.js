import bcrypt from 'bcryptjs';
import { safeExecute } from '../../../../db/config.js';
import { BadRequestError } from '../../../utils/errors/index.js';

/**
 * Resets a user's password using a valid, unused verification code.
 *
 * @param {Object} data
 * @param {string} data.code     - The 6-digit verification code from email.
 * @param {string} data.password - The new plain-text password.
 * @returns {Promise<void>}
 * @throws {BadRequestError} If the code is invalid, expired, or already used.
 */
export const resetPasswordService = async ({ code, password }) => {
  // Look up the code and join to the user to confirm the account still exists.
  const tokenSql = `
    SELECT prt.token_id, prt.user_id, prt.expires_at, prt.used
    FROM password_reset_tokens prt
    INNER JOIN users u ON u.user_id = prt.user_id
    WHERE prt.token = $1 AND prt.used = 0
    LIMIT 1
  `;
  const rows = await safeExecute(tokenSql, [code]);

  if (rows.length === 0) {
    throw new BadRequestError('Invalid or already used verification code.');
  }

  const resetToken = rows[0];

  // Check expiry.
  const now = new Date();
  const expiresAt = new Date(resetToken.expires_at);
  if (now > expiresAt) {
    throw new BadRequestError('Verification code has expired. Please request a new one.');
  }

  // Hash the new password.
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Update the user's password.
  const updateSql = 'UPDATE users SET password_hash = $1 WHERE user_id = $2';
  await safeExecute(updateSql, [hashedPassword, resetToken.user_id]);

  // Mark the code as used.
  const markUsedSql =
    'UPDATE password_reset_tokens SET used = 1 WHERE token_id = $1';
  await safeExecute(markUsedSql, [resetToken.token_id]);
};
