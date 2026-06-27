/**
 * ForgotPassword: Email input form that triggers a password-reset email.
 */
import { useState } from 'react';
import { motion as Motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, ArrowRight, MessageSquare, CheckCircle, ArrowLeft } from 'lucide-react';
import { authService } from '../../services/auth/auth.service';
import styles from './Auth.module.css';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async e => {
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
      setSubmitted(true);
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
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
          <h1 className={styles.forgotPassword__title}>Check your email</h1>
          <p className={styles.forgotPassword__subtitle}>
            If an account with <strong>{email}</strong> exists, we've sent a
            password reset link. Please check your inbox and follow the
            instructions.
          </p>
          <button
            type='button'
            className={styles.forgotPassword__button}
            onClick={() => navigate('/auth')}
          >
            <ArrowLeft size={16} />
            Back to Sign In
          </button>
        </Motion.div>
      </div>
    );
  }

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
            Enter your email address and we'll send you a link to reset your
            password.
          </p>
        </div>

        {/* Form */}
        <form className={styles.forgotPassword__form} onSubmit={handleSubmit}>
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
            {loading ? 'Sending...' : 'Send Reset Link'}
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
