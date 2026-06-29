import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { resolveMx } from 'dns';
import { safeExecute } from '../../../../db/config.js';
import {
  BadRequestError,
  UnauthenticatedError,
} from '../../../utils/errors/index.js';
import { sendEmail } from '../../../utils/email.js';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

const normalizeEmail = email => email.trim().toLowerCase();

/**
 * Validates that an email address exists on a real mail server via MX record lookup.
 * @param {string} email
 * @returns {Promise<boolean>}
 */
const validateEmailWithMx = email => {
  return new Promise(resolve => {
    const domain = email.split('@')[1];
    if (!domain) return resolve(false);

    // Add timeout to prevent hanging
    const timeout = setTimeout(() => {
      console.warn(`[MX Validation] DNS lookup timed out for ${domain}, allowing registration`);
      resolve(true); // Allow if timeout (network issues)
    }, 5000);

    resolveMx(domain, (err, addresses) => {
      clearTimeout(timeout);
      if (err) {
        console.error(`[MX Validation] DNS lookup failed for ${domain}:`, err.message);
        // If DNS lookup fails (network issues), allow registration
        return resolve(true);
      }
      if (!addresses || addresses.length === 0) {
        console.error(`[MX Validation] No MX records found for ${domain}`);
        return resolve(false);
      }
      console.log(`[MX Validation] MX records found for ${domain}:`, addresses.map(a => a.exchange).join(', '));
      resolve(true);
    });
  });
};

/**
 * Checks if a user exists by email.
 */
export const checkUserExists = async email => {
  const normalizedEmail = normalizeEmail(email);
  const sql = 'SELECT user_id FROM users WHERE email = ? LIMIT 1';
  const rows = await safeExecute(sql, [normalizedEmail]);
  return rows.length > 0;
};

/**
 * Registers a new user — validates email via MX record, creates account, returns token.
 */
export const registerService = async ({
  firstName,
  lastName,
  email,
  password,
}) => {
  const normalizedEmail = normalizeEmail(email);

  // Check if user already exists
  const userExists = await checkUserExists(normalizedEmail);
  if (userExists) {
    throw new BadRequestError('User already exists with this email.');
  }

  // Validate that the email domain has valid MX records (real email server)
  const hasMx = await validateEmailWithMx(normalizedEmail);
  if (!hasMx) {
    throw new BadRequestError('Please enter a valid email address.');
  }

  // Hash the password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create the user account directly
  const sql =
    'INSERT INTO users (first_name, last_name, email, password_hash) VALUES (?, ?, ?, ?)';
  let result;
  try {
    result = await safeExecute(sql, [firstName, lastName, normalizedEmail, hashedPassword]);
  } catch (error) {
    if (error?.code === 'ER_DUP_ENTRY') {
      throw new BadRequestError('User already exists with this email.');
    }
    throw error;
  }

  // Send welcome email
  try {
    await sendEmail({
      to: normalizedEmail,
      subject: 'Welcome to Evangadi Forum!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1a1a2e;">Welcome to Evangadi Forum, ${firstName}!</h2>
          <p style="color: #555; line-height: 1.6;">
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
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard"
             style="display: inline-block; background-color: #4f46e5; color: white;
                    padding: 12px 24px; text-decoration: none; border-radius: 6px;
                    font-weight: bold; margin-top: 10px;">
            Go to Dashboard
          </a>
        </div>
      `,
    });
  } catch (err) {
    console.error('Failed to send welcome email:', err);
  }

  // Generate JWT token
  const payload = {
    id: result.insertId,
    firstName,
    lastName,
    role: 'user',
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

  return {
    user: {
      id: result.insertId,
      firstName,
      lastName,
      email: normalizedEmail,
      role: 'user',
      avatar: null,
    },
    token,
  };
};

/**
 * Authenticates a user and generates a JWT token.
 */
export const loginService = async ({ email, password }) => {
  const normalizedEmail = normalizeEmail(email);
  const sql =
    'SELECT user_id, first_name, last_name, email, password_hash, role, status, avatar_url FROM users WHERE email = ? LIMIT 1';
  const rows = await safeExecute(sql, [normalizedEmail]);

  if (rows.length === 0) {
    throw new UnauthenticatedError('Invalid email or password');
  }

  const user = rows[0];

  if (user.status === 'banned') {
    throw new UnauthenticatedError('Your account has been banned.');
  }

  if (user.status === 'suspended') {
    throw new UnauthenticatedError('Your account has been suspended.');
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);

  if (!isMatch) {
    throw new UnauthenticatedError('Invalid email or password');
  }

  const payload = {
    id: user.user_id,
    firstName: user.first_name,
    lastName: user.last_name,
    role: user.role,
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

  return {
    user: {
      id: user.user_id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      role: user.role,
      avatar: user.avatar_url || null,
    },
    token,
  };
};
