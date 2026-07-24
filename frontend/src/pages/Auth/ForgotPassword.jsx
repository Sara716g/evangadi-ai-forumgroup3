/**
 * ForgotPassword: Email input → verify code → set new password.
 */
import { useState } from 'react';
import { motion as Motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import {
  Mail,
  ArrowRight,
  MessageSquare,
  CheckCircle,
  ArrowLeft,
  Eye,
  EyeOff,
  Lock,
} from 'lucide-react';
import { authService } from '../../services/auth/auth.service';
import styles from './Auth.module.css';

export default function ForgotPassword() {
  const navigate = useNavigate();

  // Tracks which step of the flow the user is on
  const [step, setStep] = useState('email'); // 'email' | 'verify' | 'password' | 'success'

  // --- Email step state ---
  const [email, setEmail] = useState('');

  // --- Verify code step state ---
  const [code, setCode] = useState('');

  // --- Password step state ---
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // --- Shared UI state ---
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Step 1: Validate email and request a reset code from the server
  const handleEmailSubmit = async e => {
    e.preventDefault();
    setError(null);

    // Normalize and validate the email before sending
    const normalizedEmail = email.trim().toLowerCase();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!normalizedEmail) {
      setError('Email is required.');
      return;
    }

    if (!emailPattern.test(normalizedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);

    try {
      // Call the API to send a verification code to the email
      await authService.forgotPassword(normalizedEmail);
      setStep('verify');
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify the 6-digit code the user received
  const handleCodeSubmit = async e => {
    e.preventDefault();
    setError(null);

    // Ensure code is exactly 6 digits before sending
    if (!code || code.length !== 6) {
      setError('Please enter a valid 6-digit verification code.');
      return;
    }

    setLoading(true);

    try {
      // Confirm the code matches what was sent to the email
      await authService.verifyResetCode({ email: email.trim().toLowerCase(), code });
      setStep('password');
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Set the new password after code verification
  const handlePasswordSubmit = async e => {
    e.preventDefault();
    setError(null);

    // Basic password validation before submission
    if (!password) {
      setError('Password is required.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      // Send the verified code and new password to finalize the reset
      await authService.resetPassword({ code, password });
      setStep('success');
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  // --- Success screen: shown after password is reset ---
  if (step === 'success') {
    return (
      <div className={styles.forgotPassword}>
        <Motion.div
          className={styles.forgotPassword__card}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className={styles.forgotPassword__successIcon}>
            <CheckCircle size={48} />
          </div>
          <h1 className={styles.forgotPassword__title}>Password reset successful</h1>
          <p className={styles.forgotPassword__subtitle}>
            Your password has been updated successfully. You can now sign in
            with your new password.
          </p>
          <button
            type='button'
            className={styles.forgotPassword__button}
            onClick={() => navigate('/auth')}
          >
            Sign In
            <ArrowRight size={16} />
          </button>
        </Motion.div>
      </div>
    );
  }

  // --- Password step: enter and confirm the new password ---
  if (step === 'password') {
    return (
      <div className={styles.forgotPassword}>
        <Motion.div
          className={styles.forgotPassword__card}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className={styles.forgotPassword__logo}>
            <div className={styles.forgotPassword__logoIcon}>
              <MessageSquare size={24} />
            </div>
          </div>

          <div className={styles.forgotPassword__header}>
            <h1 className={styles.forgotPassword__title}>Set new password</h1>
            <p className={styles.forgotPassword__subtitle}>
              Your code has been verified. Enter your new password below.
            </p>
          </div>

          <form className={styles.forgotPassword__form} onSubmit={handlePasswordSubmit}>
            {/* New password input with show/hide toggle */}
            <div className={styles.forgotPassword__inputGroup}>
              <label htmlFor='password' className={styles.forgotPassword__label}>
                New Password
              </label>
              <div className={styles.auth__passwordWrap}>
                <input
                  id='password'
                  type={showPassword ? 'text' : 'password'}
                  placeholder='••••••••'
                  className={`${styles.forgotPassword__input} ${styles.auth__inputPassword}`}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button
                  type='button'
                  className={styles.auth__passwordToggle}
                  onClick={() => setShowPassword(v => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm password input with show/hide toggle */}
            <div className={styles.forgotPassword__inputGroup}>
              <label htmlFor='confirmPassword' className={styles.forgotPassword__label}>
                Confirm New Password
              </label>
              <div className={styles.auth__passwordWrap}>
                <input
                  id='confirmPassword'
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder='••••••••'
                  className={`${styles.forgotPassword__input} ${styles.auth__inputPassword}`}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                />
                <button
                  type='button'
                  className={styles.auth__passwordToggle}
                  onClick={() => setShowConfirmPassword(v => !v)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && <div className={styles.forgotPassword__error}>{error}</div>}

            <button
              type='submit'
              className={styles.forgotPassword__button}
              disabled={loading}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
              {!loading && <Lock size={16} />}
            </button>
          </form>

          {/* Go back to re-enter the verification code */}
          <div className={styles.forgotPassword__footer}>
            <button
              type='button'
              onClick={() => { setStep('verify'); setError(null); }}
              className={styles.forgotPassword__backLink}
            >
              <ArrowLeft size={16} />
              Back to code verification
            </button>
          </div>
        </Motion.div>
      </div>
    );
  }

  // --- Verify code step: enter the 6-digit code sent to email ---
  if (step === 'verify') {
    return (
      <div className={styles.forgotPassword}>
        <Motion.div
          className={styles.forgotPassword__card}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className={styles.forgotPassword__logo}>
            <div className={styles.forgotPassword__logoIcon}>
              <MessageSquare size={24} />
            </div>
          </div>

          <div className={styles.forgotPassword__header}>
            <h1 className={styles.forgotPassword__title}>Enter verification code</h1>
            <p className={styles.forgotPassword__subtitle}>
              We've sent a 6-digit code to <strong>{email}</strong>. Enter it
              below to continue.
            </p>
          </div>

          <form className={styles.forgotPassword__form} onSubmit={handleCodeSubmit}>
            {/* 6-digit code input */}
            <div className={styles.forgotPassword__inputGroup}>
              <label htmlFor='code' className={styles.forgotPassword__label}>
                Verification Code
              </label>
              <input
                id='code'
                type='text'
                placeholder='Enter 6-digit code'
                className={styles.forgotPassword__input}
                value={code}
                onChange={e => setCode(e.target.value)}
                maxLength={6}
                autoFocus
              />
            </div>

            {error && <div className={styles.forgotPassword__error}>{error}</div>}

            <button
              type='submit'
              className={styles.forgotPassword__button}
              disabled={loading}
            >
              {loading ? 'Verifying...' : 'Verify Code'}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          {/* Go back to change the email address */}
          <div className={styles.forgotPassword__footer}>
            <button
              type='button'
              onClick={() => { setStep('email'); setError(null); setCode(''); }}
              className={styles.forgotPassword__backLink}
            >
              <ArrowLeft size={16} />
              Back to email
            </button>
          </div>
        </Motion.div>
      </div>
    );
  }

  // --- Email step (default): enter email to receive a reset code ---
  return (
    <div className={styles.forgotPassword}>
      <Motion.div
        className={styles.forgotPassword__card}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className={styles.forgotPassword__logo}>
          <div className={styles.forgotPassword__logoIcon}>
            <MessageSquare size={24} />
          </div>
        </div>

        <div className={styles.forgotPassword__header}>
          <h1 className={styles.forgotPassword__title}>Reset your password</h1>
          <p className={styles.forgotPassword__subtitle}>
            Enter your email address and we'll send you a verification code to
            reset your password.
          </p>
        </div>

        <form className={styles.forgotPassword__form} onSubmit={handleEmailSubmit}>
          {/* Email input field */}
          <div className={styles.forgotPassword__inputGroup}>
            <label htmlFor='email' className={styles.forgotPassword__label}>
              Email Address
            </label>
            <input
              id='email'
              type='email'
              placeholder='Enter your email address'
              className={styles.forgotPassword__input}
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          {error && <div className={styles.forgotPassword__error}>{error}</div>}

          <button
            type='submit'
            className={styles.forgotPassword__button}
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Verification Code'}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        {/* Return to the main login page */}
        <div className={styles.forgotPassword__footer}>
          <Link to='/auth' className={styles.forgotPassword__backLink}>
            <ArrowLeft size={16} />
            Back to sign in
          </Link>
        </div>
      </Motion.div>
    </div>
  );
}
