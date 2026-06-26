/**
 * ForgotPassword: Email input form that triggers a password-reset email.
 */
import { useState } from 'react';
import { motion as Motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, ArrowRight, MessageSquare, CheckCircle } from 'lucide-react';
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
                  <span>Check your email</span>
                </div>
                <h2 className={styles.auth__formTitle}>
                  Reset link sent
                </h2>
                <p className={styles.auth__formSubtitle}>
                  If an account with <strong>{email}</strong> exists, we've sent a
                  password reset link. Please check your inbox and follow the
                  instructions.
                </p>
              </div>

              <div className={styles.auth__buttonContainer}>
                <button
                  type='button'
                  className={`${styles.auth__button} ${styles['auth__button--primary']}`}
                  onClick={() => navigate('/auth')}
                >
                  Back to Sign In
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
              Forgot your password? No worries. Enter your email address below
              and we'll send you a link to reset your password.
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
                Forgot your password?
              </h2>
              <p className={styles.auth__formSubtitle}>
                Enter your email address and we'll send you a link to reset your
                password.
              </p>
            </div>

            <form className={styles.auth__form} onSubmit={handleSubmit}>
              <div className={styles.auth__inputGroup}>
                <label htmlFor='email' className={styles.auth__label}>
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id='email'
                    type='email'
                    placeholder='Enter your email address'
                    className={styles.auth__input}
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    style={{ paddingLeft: '2.75rem' }}
                  />
                  <Mail
                    size={18}
                    style={{
                      position: 'absolute',
                      left: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-tertiary)',
                    }}
                  />
                </div>
              </div>

              {error && <div className={styles.auth__error}>{error}</div>}

              <div className={styles.auth__buttonContainer}>
                <button
                  type='submit'
                  className={`${styles.auth__button} ${styles['auth__button--primary']}`}
                  disabled={loading}
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                  {!loading && (
                    <ArrowRight
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
