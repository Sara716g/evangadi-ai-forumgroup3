/**
 * ResetPassword: Form to set a new password using a verification code.
 * Reads the `code` query parameter from the URL (or can be used standalone).
 */
import { useState } from 'react';
import { motion as Motion } from 'framer-motion';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  ArrowRight,
  MessageSquare,
  CheckCircle,
  Lock,
} from 'lucide-react';
import { authService } from '../../services/auth/auth.service';
import styles from './Auth.module.css';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const codeFromUrl = searchParams.get('code');

  const [code, setCode] = useState(codeFromUrl || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setError(null);

    if (!code || code.length !== 6) {
      setError('Please enter a valid 6-digit verification code.');
      return;
    }

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
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className={styles.auth}>
        <section className={styles.auth__info}>
          <div className={styles.auth__infoContent}>
            <header className={styles.auth__infoHeader}>
              <div
                className={styles.auth__infoBranding}
                onClick={() => navigate('/')}
                title='Go to Home'
                role='button'
                tabIndex={0}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate('/');
                  }
                }}
              >
                <div className={styles.auth__infoLogo} aria-hidden>
                  <MessageSquare
                    className={styles.auth__infoLogoIcon}
                    size={22}
                  />
                </div>
                <div className={styles.auth__infoBrandCopy}>
                  <p className={styles.auth__infoTitle}>Evangadi Forum</p>
                  <p className={styles.auth__infoTagline}>
                    Learn together. Ask with context.
                  </p>
                </div>
              </div>
            </header>
          </div>
        </section>

        <section className={styles.auth__formSection}>
          <div className={styles.auth__formContainer}>
            <Motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className={styles.auth__formHeader}>
                <div className={styles.auth__success} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <CheckCircle size={20} />
                  <span>Password reset successful</span>
                </div>
                <h2 className={styles.auth__formTitle}>
                  You're all set!
                </h2>
                <p className={styles.auth__formSubtitle}>
                  Your password has been updated successfully. You can now sign
                  in with your new password.
                </p>
              </div>

              <div className={styles.auth__buttonContainer}>
                <button
                  type='button'
                  className={`${styles.auth__button} ${styles['auth__button--primary']}`}
                  onClick={() => navigate('/auth')}
                >
                  Sign In
                  <ArrowRight size={16} className={styles.auth__buttonIcon} />
                </button>
              </div>
            </Motion.div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className={styles.auth}>
      {/* Left: Info Section */}
      <section className={styles.auth__info}>
        <div className={styles.auth__infoContent}>
          <header className={styles.auth__infoHeader}>
            <div
              className={styles.auth__infoBranding}
              onClick={() => navigate('/')}
              title='Go to Home'
              role='button'
              tabIndex={0}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate('/');
                }
              }}
            >
              <div className={styles.auth__infoLogo} aria-hidden>
                <MessageSquare
                  className={styles.auth__infoLogoIcon}
                  size={22}
                />
              </div>
              <div className={styles.auth__infoBrandCopy}>
                <p className={styles.auth__infoTitle}>Evangadi Forum</p>
                <p className={styles.auth__infoTagline}>
                  Learn together. Ask with context.
                </p>
              </div>
            </div>
            <p className={styles.auth__infoDescription}>
              Enter the 6-digit verification code sent to your email, then
              create a new strong password for your account.
            </p>
          </header>
        </div>
      </section>

      {/* Right: Form Section */}
      <section className={styles.auth__formSection}>
        <div className={styles.auth__formContainer}>
          <Motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className={styles.auth__formHeader}>
              <h2 className={styles.auth__formTitle}>
                Set new password
              </h2>
              <p className={styles.auth__formSubtitle}>
                Enter your verification code and new password below.
              </p>
            </div>

            <form className={styles.auth__form} onSubmit={handleSubmit}>
              <div className={styles.auth__inputGroup}>
                <label htmlFor='code' className={styles.auth__label}>
                  Verification Code
                </label>
                <input
                  id='code'
                  type='text'
                  placeholder='Enter 6-digit code'
                  className={styles.auth__input}
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  maxLength={6}
                />
              </div>

              <div className={styles.auth__inputGroup}>
                <label htmlFor='password' className={styles.auth__label}>
                  New Password
                </label>
                <div className={styles.auth__passwordWrap}>
                  <input
                    id='password'
                    type={showPassword ? 'text' : 'password'}
                    placeholder='••••••••'
                    className={`${styles.auth__input} ${styles.auth__inputPassword}`}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                  <button
                    type='button'
                    className={styles.auth__passwordToggle}
                    onClick={() => setShowPassword(v => !v)}
                    aria-label={
                      showPassword ? 'Hide password' : 'Show password'
                    }
                    aria-pressed={showPassword}
                  >
                    {showPassword ? (
                      <EyeOff size={18} aria-hidden />
                    ) : (
                      <Eye size={18} aria-hidden />
                    )}
                  </button>
                </div>
              </div>

              <div className={styles.auth__inputGroup}>
                <label htmlFor='confirmPassword' className={styles.auth__label}>
                  Confirm New Password
                </label>
                <div className={styles.auth__passwordWrap}>
                  <input
                    id='confirmPassword'
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder='••••••••'
                    className={`${styles.auth__input} ${styles.auth__inputPassword}`}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                  />
                  <button
                    type='button'
                    className={styles.auth__passwordToggle}
                    onClick={() => setShowConfirmPassword(v => !v)}
                    aria-label={
                      showConfirmPassword
                        ? 'Hide confirm password'
                        : 'Show confirm password'
                    }
                    aria-pressed={showConfirmPassword}
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} aria-hidden />
                    ) : (
                      <Eye size={18} aria-hidden />
                    )}
                  </button>
                </div>
              </div>

              {error && <div className={styles.auth__error}>{error}</div>}

              <div className={styles.auth__buttonContainer}>
                <button
                  type='submit'
                  className={`${styles.auth__button} ${styles['auth__button--primary']}`}
                  disabled={loading}
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                  {!loading && (
                    <Lock
                      size={16}
                      className={styles.auth__buttonIcon}
                    />
                  )}
                </button>
              </div>
            </form>

            <footer className={styles.auth__formFooter}>
              <p className={styles.auth__formFooterText}>
                Remember your password?
                <Link to='/auth' className={styles.auth__formFooterLink}>
                  Back to sign in
                </Link>
              </p>
            </footer>
          </Motion.div>
        </div>
      </section>
    </div>
  );
}
