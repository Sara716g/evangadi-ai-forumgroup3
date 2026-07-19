import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER;
const IS_DEV = process.env.NODE_ENV === 'development';
const HAS_SMTP = Boolean(
  SMTP_USER && SMTP_PASS &&
  !SMTP_USER.includes('your-') && !SMTP_PASS.includes('your-')
);

let transporter = null;

/**
 * Returns a lazily-initialised nodemailer transporter.
 * Falls back to a JSON transport (logs to console) when SMTP env vars are missing
 * so that the forgot-password flow still works in development.
 */
const getTransporter = () => {
  if (transporter) return transporter;

  if (HAS_SMTP) {
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
 * Extracts a 6-digit verification code from an HTML body string.
 * Returns null if no code is found.
 */
const extractVerificationCode = (html) => {
  if (!html) return null;
  const match = html.match(/\b(\d{6})\b/);
  return match ? match[1] : null;
};

/**
 * Sends an email via the configured SMTP transport.
 *
 * In development mode (NODE_ENV=development) OR when SMTP credentials are
 * missing, the email is NOT sent. Instead, the verification code (if any)
 * is logged to the console along with the recipient and subject.
 *
 * In production with valid SMTP credentials, the email is sent normally.
 *
 * @param {Object} options
 * @param {string} options.to      - Recipient email address.
 * @param {string} options.subject - Email subject line.
 * @param {string} options.html    - HTML body.
 * @returns {Promise<void>}
 */
export const sendEmail = async ({ to, subject, html }) => {
  // ── Dev mode or no SMTP credentials: log to console, skip sending ───
  if (IS_DEV || !HAS_SMTP) {
    const code = extractVerificationCode(html);
    console.log('\n╔══════════════════════════════════════════════╗');
    if (!HAS_SMTP) {
      console.log('║  DEV MODE — Email NOT sent (no SMTP credentials)');
    } else {
      console.log('║  DEV MODE — Email NOT sent (NODE_ENV=development)');
    }
    console.log('╠══════════════════════════════════════════════╣');
    console.log(`║  To:      ${to}`);
    console.log(`║  Subject: ${subject}`);
    if (code) {
      console.log(`║  Code:    ${code}`);
    }
    console.log('╚══════════════════════════════════════════════╝\n');
    return;
  }

  // ── Production mode: send via SMTP ───────────────────────────────────
  const transport = getTransporter();

  const mailOptions = {
    from: SMTP_FROM,
    to,
    subject,
    html,
  };

  await transport.sendMail(mailOptions);
};
