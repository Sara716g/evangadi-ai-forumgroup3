import bcrypt from 'bcryptjs';
import { safeExecute } from '../../../../db/config.js';
import { BadRequestError } from '../../../utils/errors/index.js';

/**
 * Resets a user's password using a valid, unused reset token.
 *
 * @param {Object} data
 * @param {string} data.token    - The reset token from the email link.
 * @param {string} data.password - The new plain-text password.
 * @returns {Promise<void>}
 * @throws {BadRequestError} If the token is invalid, expired, or already used.
 */
export const resetPasswordService = async ({ token, password }) => {
  // Look up the token and join to the user to confirm the account still exists.
  const tokenSql = `
    SELECT prt.token_id, prt.user_id, prt.expires_at, prt.used
    FROM password_reset_tokens prt
    INNER JOIN users u ON u.user_id = prt.user_id
    WHERE prt.token = ? AND prt.used = 0
    LIMIT 1
  `;
  const rows = await safeExecute(tokenSql, [token]);

  if (rows.length === 0) {
    throw new BadRequestError('Invalid or already used reset token.');
  }

  const resetToken = rows[0];

  // Check expiry.
  const now = new Date();
  const expiresAt = new Date(resetToken.expires_at);
  if (now > expiresAt) {
    throw new BadRequestError('Reset token has expired. Please request a new one.');
  }

  // Hash the new password.
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Update the user's password.
  const updateSql = 'UPDATE users SET password_hash = ? WHERE user_id = ?';
  await safeExecute(updateSql, [hashedPassword, resetToken.user_id]);

  // Mark the token as used.
  const markUsedSql =
    'UPDATE password_reset_tokens SET used = 1 WHERE token_id = ?';
  await safeExecute(markUsedSql, [resetToken.token_id]);
};
