import crypto from 'crypto';
import { safeExecute } from '../../../../db/config.js';
import { sendEmail } from '../../../utils/email.js';
import { passwordResetEmailTemplate } from '../../../utils/email-templates.js';
import { BadRequestError, NotFoundError } from '../../../utils/errors/index.js';

const normalizeEmail = email => email.trim().toLowerCase();

/**
 * Generates a 6-digit verification code.
 *
 * @returns {string} A 6-digit numeric code.
 */
const generateVerificationCode = () =>
  String(Math.floor(100000 + Math.random() * 900000));

/**
 * Creates a password reset verification code and sends it via email.
 *
 * @param {string} email - The user's email address.
 * @returns {Promise<void>}
 */
export const forgotPasswordService = async email => {
  const normalizedEmail = normalizeEmail(email);

  // Look up the user – silently succeed even if the email doesn't exist
  // to prevent email enumeration attacks.
  const userSql =
    'SELECT user_id, first_name, email FROM users WHERE email = ? LIMIT 1';
  const rows = await safeExecute(userSql, [normalizedEmail]);

  if (rows.length === 0) {
    // Return early without revealing whether the email exists.
    return;
  }

  const user = rows[0];

  // Invalidate any previously unused tokens/codes for this user.
  const invalidateSql =
    'UPDATE password_reset_tokens SET used = 1 WHERE user_id = ? AND used = 0';
  await safeExecute(invalidateSql, [user.user_id]);

  // Generate and store the new verification code (expires in 15 minutes).
  const code = generateVerificationCode();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000)
    .toISOString()
    .slice(0, 19)
    .replace('T', ' ');

  const insertSql =
    'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)';
  await safeExecute(insertSql, [user.user_id, code, expiresAt]);

  // Send password reset email (in dev mode, sendEmail logs the code to console instead)
  try {
    await sendEmail({
      to: user.email,
      subject: 'Evangadi Forum – Password Reset Code',
      html: passwordResetEmailTemplate(user.first_name, code),
    });
  } catch (err) {
    console.error('Failed to send password reset email:', err);
  }
};

/**
 * Verifies a password reset code is valid and not expired.
 * Returns the user_id if valid, throws otherwise.
 *
 * @param {string} email - The user's email address.
 * @param {string} code  - The 6-digit verification code.
 * @returns {Promise<void>}
 * @throws {BadRequestError} If code is invalid or expired.
 */
export const verifyResetCodeService = async ({ email, code }) => {
  const normalizedEmail = normalizeEmail(email);

  const tokenSql = `
    SELECT prt.token_id, prt.user_id, prt.expires_at, prt.used
    FROM password_reset_tokens prt
    INNER JOIN users u ON u.user_id = prt.user_id
    WHERE prt.token = ? AND u.email = ? AND prt.used = 0
    LIMIT 1
  `;
  const rows = await safeExecute(tokenSql, [code, normalizedEmail]);

  if (rows.length === 0) {
    throw new BadRequestError('Invalid verification code.');
  }

  const resetToken = rows[0];

  // Check expiry
  const now = new Date();
  const expiresAt = new Date(resetToken.expires_at);
  if (now > expiresAt) {
    throw new BadRequestError('Verification code has expired. Please request a new one.');
  }

  // Code is valid — return success
  return { success: true, message: 'Verification code is valid.' };
};
