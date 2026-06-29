import crypto from 'crypto';
import { safeExecute } from '../../../../db/config.js';
import { sendEmail } from '../../../utils/email.js';
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

  // Log verification code to console (useful in development)
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║  PASSWORD RESET CODE                     ║');
  console.log('╠══════════════════════════════════════════╣');
  console.log(`║  Email: ${normalizedEmail}`);
  console.log(`║  Code:  ${code}`);
  console.log('╚══════════════════════════════════════════╝\n');

  // Build the email with the verification code.
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #1a1a1a; margin-bottom: 16px;">Reset Your Password</h2>
      <p style="color: #4a4a4a; line-height: 1.6;">
        Hi ${user.first_name},
      </p>
      <p style="color: #4a4a4a; line-height: 1.6;">
        We received a request to reset your password. Please use the following verification code:
      </p>
      <div style="text-align: center; margin: 24px 0;">
        <span style="display: inline-block; font-size: 32px; font-weight: bold;
                     color: #f97316; letter-spacing: 8px; padding: 16px 32px;
                     background-color: #fff7ed; border-radius: 8px;">
          ${code}
        </span>
      </div>
      <p style="color: #4a4a4a; line-height: 1.6; font-size: 14px;">
        This code expires in <strong>15 minutes</strong>.
      </p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="color: #999; font-size: 12px;">
        If you didn't request a password reset, you can safely ignore this email.
      </p>
    </div>
  `;

  await sendEmail({
    to: user.email,
    subject: 'Evangadi Forum – Password Reset Code',
    html,
  });
};
