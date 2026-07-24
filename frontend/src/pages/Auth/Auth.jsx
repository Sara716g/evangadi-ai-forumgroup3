/**
 * Auth: combined login + register form with email verification flow.
 * Steps: login/register → verify-email → dashboard
 */
import { useState } from 'react';

import { motion as Motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Sparkles,
  Code,
  ArrowRight,
  Eye,
  EyeOff,
  MessageSquare,
  Mail,
  CheckCircle,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/auth/auth.service';
import styles from './Auth.module.css';

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { register, login, verifyEmail } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState('form'); // 'form' | 'verify'

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Verification state
  const [verificationCode, setVerificationCode] = useState('');
  const [registeredEmail, setRegisteredEmail] = useState('');

  // Error and loading state
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  // Handle form submission for both login and registration
  const handleSubmit = async e => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
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

    if (!password.trim()) {
      setError('Password is required.');
      return;
    }

    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();

    if (!isLogin) {
      if (!trimmedFirstName) {
        setError('First name is required.');
        return;
      }
      if (trimmedFirstName.length < 3) {
        setError('First name must be at least 3 characters long.');
        return;
      }
      if (!trimmedLastName) {
        setError('Last name is required.');
        return;
      }
      if (trimmedLastName.length < 3) {
        setError('Last name must be at least 3 characters long.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
      }
    }

    setLoading(true);

    try {
      if (isLogin) {
        await login({ email: normalizedEmail, password });
        setSuccessMessage('Sign-in successful. Redirecting...');
        setEmail('');
        setPassword('');
        setShowPassword(false);
        await new Promise(resolve => setTimeout(resolve, 1000));
        const from = location.state?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      } else {
        // Registration flow — create account (unverified)
        await register({
          firstName: trimmedFirstName,
          lastName: trimmedLastName,
          email: normalizedEmail,
          password,
        });

        // Store the email for verification and switch to verify step
        setRegisteredEmail(normalizedEmail);
        setStep('verify');
        setSuccessMessage('Account created! Check your email for a verification code.');
        setVerificationCode('');
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  // Handle email verification
  const handleVerifyEmail = async e => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit verification code.');
      return;
    }

    setLoading(true);

    try {
      await verifyEmail({
        email: registeredEmail,
        code: verificationCode,
      });
      setSuccessMessage('Email verified successfully! Redirecting...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  // Handle resend verification
  const handleResendVerification = async () => {
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      await authService.resendVerification(registeredEmail);
      setSuccessMessage('New verification code sent! Check your email.');
    } catch (err) {
      setError(err.message || 'Failed to resend code.');
    } finally {
      setLoading(false);
    }
  };

  // Verification step
  if (step === 'verify') {
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
              <p className={styles.auth__infoDescription}>
                We've sent a verification code to your email address. Enter the
                6-digit code below to verify your account and start using
                Evangadi Forum.
              </p>
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
                <h2 className={styles.auth__formTitle}>
                  Verify your email
                </h2>
                <p className={styles.auth__formSubtitle}>
                  Enter the 6-digit code sent to <strong>{registeredEmail}</strong>
                </p>
              </div>

              <form className={styles.auth__form} onSubmit={handleVerifyEmail}>
                <div className={styles.auth__inputGroup}>
                  <label htmlFor='verificationCode' className={styles.auth__label}>
                    Verification Code
                  </label>
                  <input
                    id='verificationCode'
                    type='text'
                    placeholder='Enter 6-digit code'
                    className={styles.auth__input}
                    value={verificationCode}
                    onChange={e => setVerificationCode(e.target.value)}
                    maxLength={6}
                    autoFocus
                  />
                </div>

                {successMessage && (
                  <div className={styles.auth__success}>{successMessage}</div>
                )}

                {error && <div className={styles.auth__error}>{error}</div>}

                <div className={styles.auth__buttonContainer}>
                  <button
                    type='submit'
                    className={`${styles.auth__button} ${styles['auth__button--primary']}`}
                    disabled={loading}
                  >
                    {loading ? 'Verifying...' : 'Verify Email'}
                    {!loading && (
                      <CheckCircle size={16} className={styles.auth__buttonIcon} />
                    )}
                  </button>
                </div>
              </form>

              <footer className={styles.auth__formFooter}>
                <p className={styles.auth__formFooterText}>
                  Didn't receive a code?
                  <button
                    onClick={handleResendVerification}
                    className={styles.auth__formFooterLink}
                    disabled={loading}
                  >
                    <RefreshCw size={14} style={{ marginRight: '4px' }} />
                    Resend Code
                  </button>
                </p>
                <p className={styles.auth__formFooterText}>
                  <button
                    onClick={() => {
                      setStep('form');
                      setError(null);
                      setSuccessMessage(null);
                      setVerificationCode('');
                    }}
                    className={styles.auth__formFooterLink}
                  >
                    Back to sign in
                  </button>
                </p>
              </footer>
            </Motion.div>
          </div>
        </section>
      </div>
    );
  }

  // Form step (login/register)
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
              Sign in to post technical questions, follow threads, and search
              the forum with both keyword and AI similarity modes, built for
              Evangadi coursework and peer review.
            </p>
          </header>

          <div className={styles.auth__features}>
            <div className={styles.auth__feature}>
              <div className={styles.auth__featureIcon}>
                <Sparkles size={20} />
              </div>
              <div className={styles.auth__featureContent}>
                <h3 className={styles.auth__featureTitle}>Visible reasoning</h3>
                <p className={styles.auth__featureDescription}>
                  Threads stay readable: markdown, code blocks, and replies
                  build a mini knowledge base your cohort can revisit before
                  exams.
                </p>
              </div>
            </div>
            <div className={styles.auth__feature}>
              <div className={styles.auth__featureIcon}>
                <Code size={20} />
              </div>
              <div className={styles.auth__featureContent}>
                <h3 className={styles.auth__featureTitle}>
                  Low-friction workflow
                </h3>
                <p className={styles.auth__featureDescription}>
                  One layout for asking, answering, and scanning search results,
                  so you spend energy on the problem, not on hunting controls.
                </p>
              </div>
            </div>
          </div>

          <div className={styles.auth__infoFooter}>
            <div className={styles.auth__infoFooterContent}>
              <div className={styles.auth__infoAvatars}>
                {[1, 2, 3].map(i => (
                  <img
                    key={i}
                    src={`https://picsum.photos/seed/${i + 50}/100/100`}
                    className={styles.auth__infoAvatar}
                    alt='u'
                    referrerPolicy='no-referrer'
                  />
                ))}
              </div>
              <span className={styles.auth__infoBadge}>
                Evangadi cohorts · weekly stand-ups · office-hour style help
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Right: Auth Forms */}
      <section className={styles.auth__formSection}>
        <div className={styles.auth__formContainer}>
          <AnimatePresence mode='wait'>
            <Motion.div
              key={isLogin ? 'login' : 'register'}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className={styles.auth__formHeader}>
                <h2 className={styles.auth__formTitle}>
                  {isLogin ? 'Sign in to your account' : 'Create an account'}
                </h2>
                <p className={styles.auth__formSubtitle}>
                  {isLogin
                    ? 'Enter your email address and password to continue.'
                    : 'Complete the form below to create your account.'}
                </p>
              </div>

              <form className={styles.auth__form} onSubmit={handleSubmit}>
                {!isLogin && (
                  <>
                    <div className={styles.auth__inputGroup}>
                      <label htmlFor='firstName' className={styles.auth__label}>
                        First Name
                      </label>
                      <input
                        id='firstName'
                        type='text'
                        placeholder='First name'
                        className={styles.auth__input}
                        value={firstName}
                        onChange={e => setFirstName(e.target.value)}
                      />
                    </div>

                    <div className={styles.auth__inputGroup}>
                      <label htmlFor='lastName' className={styles.auth__label}>
                        Last Name
                      </label>
                      <input
                        id='lastName'
                        type='text'
                        placeholder='Last name'
                        className={styles.auth__input}
                        value={lastName}
                        onChange={e => setLastName(e.target.value)}
                      />
                    </div>
                  </>
                )}

                <div className={styles.auth__inputGroup}>
                  <label htmlFor='email' className={styles.auth__label}>
                    Email Address
                  </label>
                  <input
                    id='email'
                    type='email'
                    placeholder='Enter your email address'
                    className={styles.auth__input}
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoComplete='off'
                  />
                </div>

                <div className={styles.auth__inputGroup}>
                  <label htmlFor='password' className={styles.auth__label}>
                    Password
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
                  {isLogin && (
                    <Link
                      to='/auth/forgot-password'
                      className={styles.auth__forgotPassword}
                    >
                      Forgot Password?
                    </Link>
                  )}
                </div>

                {successMessage && (
                  <div className={styles.auth__success}>{successMessage}</div>
                )}

                {error && <div className={styles.auth__error}>{error}</div>}

                <div className={styles.auth__buttonContainer}>
                  <button
                    type='submit'
                    className={`${styles.auth__button} ${styles['auth__button--primary']}`}
                    disabled={loading}
                  >
                    {loading
                      ? 'Processing...'
                      : isLogin
                      ? 'Sign In'
                      : 'Create Account'}
                    {!loading && (
                      <ArrowRight
                        size={16}
                        className={styles.auth__buttonIcon}
                      />
                    )}
                  </button>
                </div>

                <div className={styles.auth__divider}>
                  <div className={styles.auth__dividerLine}>
                    <div className={styles.auth__dividerBorder}></div>
                  </div>
                  <div className={styles.auth__dividerText}>
                    Additional options
                  </div>
                </div>
              </form>

              <footer className={styles.auth__formFooter}>
                <p className={styles.auth__formFooterText}>
                  {isLogin ? (
                    <>
                      Don't have an account?
                      <button
                        onClick={() => setIsLogin(false)}
                        className={styles.auth__formFooterLink}
                      >
                        Create an account
                      </button>
                    </>
                  ) : (
                    <>
                      Already have an account?
                      <button
                        onClick={() => setIsLogin(true)}
                        className={styles.auth__formFooterLink}
                      >
                        Back to sign in
                      </button>
                    </>
                  )}
                </p>
              </footer>
            </Motion.div>
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
}
