/**
 * ForgotPassword: Email input → verification code → set new password.
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
  const [step, setStep] = useState('email'); // 'email' | 'code' | 'password' | 'success'

  // Email step
  const [email, setEmail] = useState('');

  // Code step
  const [code, setCode] = useState('');

  // Password step
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Common state
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleEmailSubmit = async e => {
    e.preventDefault();
    setError(null);

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
      await authService.forgotPassword(normalizedEmail);
      setStep('code');
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async e => {
    e.preventDefault();
    setError(null);

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
      await authService.resetPassword({ code, password });
      setStep('success');
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  // Success screen
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

  // Code verification step
  if (step === 'code') {
    return (
      <div className={styles.forgotPassword}>
        <Motion.div
          className={styles.forgotPassword__card}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Logo */}
          <div className={styles.forgotPassword__logo}>
            <div className={styles.forgotPassword__logoIcon}>
              <MessageSquare size={24} />
            </div>
          </div>

          {/* Header */}
          <div className={styles.forgotPassword__header}>
            <h1 className={styles.forgotPassword__title}>Enter verification code</h1>
            <p className={styles.forgotPassword__subtitle}>
              We've sent a 6-digit code to <strong>{email}</strong>. Enter it
              below to continue.
            </p>
          </div>

          {/* Code + Password Form */}
          <form className={styles.forgotPassword__form} onSubmit={handlePasswordSubmit}>
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

          {/* Footer */}
          <div className={styles.forgotPassword__footer}>
            <button
              type='button'
              onClick={() => { setStep('email'); setError(null); }}
              className={styles.forgotPassword__backLink}
            >
              <ArrowLeft size={16} />
              ← Back to email
            </button>
          </div>
        </Motion.div>
      </div>
    );
  }

  // Email input step (default)
  return (
    <div className={styles.forgotPassword}>
      <Motion.div
        className={styles.forgotPassword__card}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Logo */}
        <div className={styles.forgotPassword__logo}>
          <div className={styles.forgotPassword__logoIcon}>
            <MessageSquare size={24} />
          </div>
        </div>

        {/* Header */}
        <div className={styles.forgotPassword__header}>
          <h1 className={styles.forgotPassword__title}>Reset your password</h1>
          <p className={styles.forgotPassword__subtitle}>
            Enter your email address and we'll send you a verification code to
            reset your password.
          </p>
        </div>

        {/* Form */}
        <form className={styles.forgotPassword__form} onSubmit={handleEmailSubmit}>
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

        {/* Footer */}
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
