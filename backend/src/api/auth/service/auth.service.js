import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { resolveMx } from 'dns';
import { safeExecute } from '../../../../db/config.js';
import {
  BadRequestError,
  UnauthenticatedError,
  NotFoundError,
} from '../../../utils/errors/index.js';
import { sendEmail } from '../../../utils/email.js';
import {
  verificationEmailTemplate,
  welcomeEmailTemplate,
} from '../../../utils/email-templates.js';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

const normalizeEmail = email => email.trim().toLowerCase();

/**
 * Generates a 6-digit numeric verification code.
 */
const generateVerificationCode = () =>
  String(Math.floor(100000 + Math.random() * 900000));

/**
 * Validates that an email address exists on a real mail server via MX record lookup.
 */
const validateEmailWithMx = email => {
  return new Promise(resolve => {
    const domain = email.split('@')[1];
    if (!domain) return resolve(false);

    const timeout = setTimeout(() => {
      console.warn(`[MX Validation] DNS lookup timed out for ${domain}, allowing registration`);
      resolve(true);
    }, 5000);

    resolveMx(domain, (err, addresses) => {
      clearTimeout(timeout);
      if (err) {
        console.error(`[MX Validation] DNS lookup failed for ${domain}:`, err.message);
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
  const sql = 'SELECT user_id FROM users WHERE email = $1 LIMIT 1';
  const rows = await safeExecute(sql, [normalizedEmail]);
  return rows.length > 0;
};

/**
 * Registers a new user — validates email via MX record, creates account as UNVERIFIED,
 * generates verification code, sends verification email.
 * Returns user info but NO token (user must verify email first).
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

  // Generate verification code (expires in 15 minutes)
  const verificationCode = generateVerificationCode();
  const codeExpiresAt = new Date(Date.now() + 15 * 60 * 1000)
    .toISOString()
    .slice(0, 19)
    .replace('T', ' ');

  // Create the user account as unverified
  const sql = `
    INSERT INTO users (first_name, last_name, email, password_hash, is_verified, verification_code, verification_code_expires_at)
    VALUES ($1, $2, $3, $4, FALSE, $5, $6)
    RETURNING user_id
  `;
  let result;
  try {
    result = await safeExecute(sql, [
      firstName,
      lastName,
      normalizedEmail,
      hashedPassword,
      verificationCode,
      codeExpiresAt,
    ]);
  } catch (error) {
    if (error?.code === '23505') {
      throw new BadRequestError('User already exists with this email.');
    }
    throw error;
  }

  // Send verification email (in dev mode, sendEmail logs the code to console instead)
  try {
    await sendEmail({
      to: normalizedEmail,
      subject: 'Evangadi Forum – Verify Your Email',
      html: verificationEmailTemplate(firstName, verificationCode),
    });
  } catch (err) {
    console.error('Failed to send verification email:', err);
  }

  // Return user info but NO token — user must verify email first
  return {
    user: {
      id: result[0].user_id,
      firstName,
      lastName,
      email: normalizedEmail,
      role: 'user',
      avatar: null,
      isVerified: false,
    },
    message: 'Account created. Please check your email for a verification code.',
  };
};

/**
 * Verifies a user's email address using the 6-digit OTP code.
 * Marks user as verified, sends welcome email, returns JWT token.
 */
export const verifyEmailService = async ({ email, code }) => {
  const normalizedEmail = normalizeEmail(email);

  const sql = `
    SELECT user_id, first_name, last_name, email, role, is_verified,
           verification_code, verification_code_expires_at
    FROM users
    WHERE email = $1 AND verification_code = $2
    LIMIT 1
  `;
  const rows = await safeExecute(sql, [normalizedEmail, code]);

  if (rows.length === 0) {
    throw new BadRequestError('Invalid verification code.');
  }

  const user = rows[0];

  if (user.is_verified) {
    throw new BadRequestError('Email is already verified. You can sign in.');
  }

  // Check expiry
  const now = new Date();
  const expiresAt = new Date(user.verification_code_expires_at);
  if (now > expiresAt) {
    throw new BadRequestError('Verification code has expired. Please register again.');
  }

  // Mark user as verified and clear verification fields
  const updateSql = `
    UPDATE users
    SET is_verified = TRUE,
        verification_code = NULL,
        verification_code_expires_at = NULL
    WHERE user_id = $1
  `;
  await safeExecute(updateSql, [user.user_id]);

  // Send welcome email
  try {
    await sendEmail({
      to: normalizedEmail,
      subject: 'Welcome to Evangadi Forum!',
      html: welcomeEmailTemplate(user.first_name),
    });
  } catch (err) {
    console.error('Failed to send welcome email:', err);
  }

  // Generate JWT token
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
      avatar: null,
      isVerified: true,
    },
    token,
  };
};

/**
 * Resends the email verification code.
 * Generates a new code and sends it via email.
 */
export const resendVerificationService = async email => {
  const normalizedEmail = normalizeEmail(email);

  const userSql = `
    SELECT user_id, first_name, is_verified
    FROM users WHERE email = $1 LIMIT 1
  `;
  const rows = await safeExecute(userSql, [normalizedEmail]);

  if (rows.length === 0) {
    // Silently succeed to prevent email enumeration
    return;
  }

  const user = rows[0];

  if (user.is_verified) {
    throw new BadRequestError('Email is already verified. You can sign in.');
  }

  // Generate new verification code
  const verificationCode = generateVerificationCode();
  const codeExpiresAt = new Date(Date.now() + 15 * 60 * 1000)
    .toISOString()
    .slice(0, 19)
    .replace('T', ' ');

  const updateSql = `
    UPDATE users
    SET verification_code = $1, verification_code_expires_at = $2
    WHERE user_id = $3
  `;
  await safeExecute(updateSql, [verificationCode, codeExpiresAt, user.user_id]);

  // Send verification email
  // Resend verification email (in dev mode, sendEmail logs the code to console instead)
  try {
    await sendEmail({
      to: normalizedEmail,
      subject: 'Evangadi Forum – Verify Your Email',
      html: verificationEmailTemplate(user.first_name, verificationCode),
    });
  } catch (err) {
    console.error('Failed to send verification email:', err);
  }
};

/**
 * Authenticates a user and generates a JWT token.
 * Now checks is_verified before allowing login.
 */
export const loginService = async ({ email, password }) => {
  const normalizedEmail = normalizeEmail(email);
  const sql =
    'SELECT user_id, first_name, last_name, email, password_hash, role, status, is_verified, avatar_url FROM users WHERE email = $1 LIMIT 1';
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

  // Check if email is verified
  if (!user.is_verified) {
    throw new UnauthenticatedError(
      'Please verify your email before signing in. Check your inbox for a verification code.',
    );
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
      isVerified: !!user.is_verified,
    },
    token,
  };
};
