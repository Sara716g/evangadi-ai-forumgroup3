import { apiClient } from '../core/api.client.js';

/**
 * Registers a new user — creates account (unverified) and sends verification code.
 * @param {Object} userData - User details for registration.
 */
async function register(userData) {
  try {
    const response = await apiClient.post('/api/auth/register', userData);
    const { user } = response.data;

    // Store user info locally but do NOT store token yet
    // (user must verify email first)
    localStorage.setItem('user', JSON.stringify(user));

    return { user };
  } catch (error) {
    throw handleAuthError(error);
  }
}

/**
 * Verifies email using 6-digit OTP code.
 * @param {Object} data - { email, code }
 */
async function verifyEmail({ email, code }) {
  try {
    const response = await apiClient.post('/api/auth/verify-email', { email, code });
    const { user, token } = response.data;

    // Store token and user after successful verification
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));

    return { user, token };
  } catch (error) {
    throw handleAuthError(error);
  }
}

/**
 * Resends email verification code.
 * @param {string} email
 */
async function resendVerification(email) {
  try {
    await apiClient.post('/api/auth/resend-verification', { email });
    return { success: true };
  } catch (error) {
    throw handleAuthError(error);
  }
}

/**
 * Logs in an existing user and stores their session in localStorage.
 * @param {Object} credentials - User login credentials.
 */
async function login(credentials) {
  try {
    const response = await apiClient.post('/api/auth/login', credentials);
    const { user, token } = response.data;

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));

    return { user, token };
  } catch (error) {
    throw handleAuthError(error);
  }
}

/**
 * Logs out the current user by clearing localStorage.
 */
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

/**
 * Retrieves the stored JWT token from localStorage.
 */
function getStoredToken() {
  return localStorage.getItem('token');
}

/**
 * Retrieves the stored user object from localStorage.
 */
function getStoredUser() {
  const userJson = localStorage.getItem('user');
  if (!userJson) return null;

  try {
    return JSON.parse(userJson);
  } catch {
    localStorage.removeItem('user');
    return null;
  }
}

/**
 * Checks if the user is currently authenticated based on local storage.
 */
function isAuthenticated() {
  return !!getStoredToken();
}

/**
 * Centralized error handler for auth service requests.
 */
function handleAuthError(error) {
  if (!error.response) {
    if (error.code === 'ECONNABORTED') {
      return new Error('Request timed out. Please try again.');
    }
    return new Error(
      'Unable to connect to server. Please check your internet connection.',
    );
  }

  const status = error.response.status;
  const backendMessage =
    error.response.data?.msg || error.response.data?.message;

  switch (status) {
    case 400:
      return new Error(backendMessage || 'Invalid input data.');
    case 401:
      return new Error(backendMessage || 'Invalid email or password.');
    case 429:
      return new Error(
        backendMessage || 'Too many requests. Please try again later.',
      );
    case 500:
      return new Error(
        'Something went wrong on our end. Please try again later.',
      );
    default:
      return new Error(backendMessage || 'An unexpected error occurred.');
  }
}

/**
 * Sends a forgot-password request to generate a reset email.
 * @param {string} email - The user's email address.
 */
async function forgotPassword(email) {
  try {
    await apiClient.post('/api/auth/forgot-password', { email });
    return { success: true };
  } catch (error) {
    throw handleAuthError(error);
  }
}

/**
 * Verifies a password reset code.
 * @param {Object} data - { email, code }
 */
async function verifyResetCode({ email, code }) {
  try {
    await apiClient.post('/api/auth/verify-reset-code', { email, code });
    return { success: true };
  } catch (error) {
    throw handleAuthError(error);
  }
}

/**
 * Resets a user's password using a valid reset code.
 * @param {Object} data - { code, password }
 */
async function resetPassword({ code, password }) {
  try {
    await apiClient.post('/api/auth/reset-password', { code, password });
    return { success: true };
  } catch (error) {
    throw handleAuthError(error);
  }
}

/**
 * Service for handling auth-related requests.
 */
export const authService = {
  register,
  verifyEmail,
  resendVerification,
  login,
  logout,
  getStoredToken,
  getStoredUser,
  isAuthenticated,
  forgotPassword,
  verifyResetCode,
  resetPassword,
};
