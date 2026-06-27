import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER;

let transporter = null;

/**
 * Returns a lazily-initialised nodemailer transporter.
 * Falls back to a JSON transport (logs to console) when SMTP env vars are missing
 * so that the forgot-password flow still works in development.
 */
const getTransporter = () => {
  if (transporter) return transporter;

  if (SMTP_USER && SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
  } else {
    // Development fallback – prints the email to stdout instead of sending.
    transporter = nodemailer.createTransport({ jsonTransport: true });
  }

  return transporter;
};

/**
 * Sends an email via the configured SMTP transport.
 *
 * @param {Object} options
 * @param {string} options.to      - Recipient email address.
 * @param {string} options.subject - Email subject line.
 * @param {string} options.html    - HTML body.
 * @returns {Promise<void>}
 */
export const sendEmail = async ({ to, subject, html }) => {
  const transport = getTransporter();

  const mailOptions = {
    from: SMTP_FROM,
    to,
    subject,
    html,
  };

  const info = await transport.sendMail(mailOptions);

  // In development without SMTP config, log the generated email payload.
  if (!SMTP_USER || !SMTP_PASS) {
    console.log('[Email Service] Development mode – email not sent:');
    console.log(JSON.parse(info.message));
  }
};
