import crypto from 'crypto';
import { safeExecute } from '../../../../db/config.js';
import { sendEmail } from '../../../utils/email.js';
import { BadRequestError, NotFoundError } from '../../../utils/errors/index.js';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const normalizeEmail = email => email.trim().toLowerCase();

/**
 * Generates a cryptographically secure random token.
 *
 * @returns {string} A 64-character hex string.
 */
const generateResetToken = () => crypto.randomBytes(32).toString('hex');

/**
 * Creates a password reset token for a user and sends them a reset email.
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

  // Invalidate any previously unused tokens for this user.
  const invalidateSql =
    'UPDATE password_reset_tokens SET used = 1 WHERE user_id = ? AND used = 0';
  await safeExecute(invalidateSql, [user.user_id]);

  // Generate and store the new reset token (expires in 1 hour).
  const token = generateResetToken();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');

  const insertSql =
    'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)';
  await safeExecute(insertSql, [user.user_id, token, expiresAt]);

  // Build the reset URL and send the email.
  const resetUrl = `${FRONTEND_URL}/auth/reset-password?token=${token}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #1a1a1a; margin-bottom: 16px;">Reset Your Password</h2>
      <p style="color: #4a4a4a; line-height: 1.6;">
        Hi ${user.first_name},
      </p>
      <p style="color: #4a4a4a; line-height: 1.6;">
        We received a request to reset your password. Click the button below to set a new password. This link expires in <strong>1 hour</strong>.
      </p>
      <div style="text-align: center; margin: 24px 0;">
        <a href="${resetUrl}"
           style="background-color: #f97316; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
          Reset Password
        </a>
      </div>
      <p style="color: #4a4a4a; line-height: 1.6; font-size: 14px;">
        If the button doesn't work, copy and paste this link into your browser:
      </p>
      <p style="color: #f97316; word-break: break-all; font-size: 14px;">
        ${resetUrl}
      </p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="color: #999; font-size: 12px;">
        If you didn't request a password reset, you can safely ignore this email.
      </p>
    </div>
  `;

  await sendEmail({
    to: user.email,
    subject: 'Evangadi Forum – Reset Your Password',
    html,
  });
};
