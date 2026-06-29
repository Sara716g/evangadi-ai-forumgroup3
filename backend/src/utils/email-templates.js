/**
 * Reusable HTML email templates for authentication flows.
 */

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

/**
 * Email verification template (sent on registration).
 * @param {string} firstName
 * @param {string} code - 6-digit OTP
 * @param {number} expiryMinutes
 */
export const verificationEmailTemplate = (firstName, code, expiryMinutes = 15) => `
  <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
    <h2 style="color: #1a1a2e; margin-bottom: 16px;">Verify Your Email</h2>
    <p style="color: #4a4a4a; line-height: 1.6;">
      Hi ${firstName},
    </p>
    <p style="color: #4a4a4a; line-height: 1.6;">
      Thanks for creating an account on Evangadi Forum. Please verify your email address by entering the code below:
    </p>
    <div style="text-align: center; margin: 24px 0;">
      <span style="display: inline-block; font-size: 32px; font-weight: bold;
                   color: #4f46e5; letter-spacing: 8px; padding: 16px 32px;
                   background-color: #eef2ff; border-radius: 8px;">
        ${code}
      </span>
    </div>
    <p style="color: #4a4a4a; line-height: 1.6; font-size: 14px;">
      This code expires in <strong>${expiryMinutes} minutes</strong>.
    </p>
    <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
    <p style="color: #999; font-size: 12px;">
      If you didn't create an account, you can safely ignore this email.
    </p>
  </div>
`;

/**
 * Welcome email template (sent after successful verification).
 * @param {string} firstName
 */
export const welcomeEmailTemplate = firstName => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #1a1a2e;">Welcome to Evangadi Forum, ${firstName}!</h2>
    <p style="color: #555; line-height: 1.6;">
      Your email has been verified and your account is now active.
      Thank you for joining Evangadi Forum — a practice space for technical Q&A,
      peer feedback, and AI-assisted search built for Evangadi learners and mentors.
    </p>
    <div style="background-color: #f8f9fa; padding: 16px; border-radius: 8px; margin: 20px 0;">
      <h3 style="color: #1a1a2e; margin-top: 0;">Here's what you can do:</h3>
      <ul style="color: #555; line-height: 1.8;">
        <li>Ask technical questions and get help from the community</li>
        <li>Answer questions to help other learners</li>
        <li>Use AI-powered search to find relevant answers faster</li>
        <li>Upload documents to the knowledge base</li>
      </ul>
    </div>
    <a href="${FRONTEND_URL}/dashboard"
       style="display: inline-block; background-color: #4f46e5; color: white;
              padding: 12px 24px; text-decoration: none; border-radius: 6px;
              font-weight: bold; margin-top: 10px;">
      Go to Dashboard
    </a>
  </div>
`;

/**
 * Password reset code template.
 * @param {string} firstName
 * @param {string} code - 6-digit OTP
 * @param {number} expiryMinutes
 */
export const passwordResetEmailTemplate = (firstName, code, expiryMinutes = 15) => `
  <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
    <h2 style="color: #1a1a2e; margin-bottom: 16px;">Reset Your Password</h2>
    <p style="color: #4a4a4a; line-height: 1.6;">
      Hi ${firstName},
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
      This code expires in <strong>${expiryMinutes} minutes</strong>.
    </p>
    <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
    <p style="color: #999; font-size: 12px;">
      If you didn't request a password reset, you can safely ignore this email.
    </p>
  </div>
`;
