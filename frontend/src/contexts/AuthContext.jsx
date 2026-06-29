import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth/auth.service.js';

/**
 * Authentication Context providing user state and auth methods.
 */
const AuthContext = createContext(undefined);

/**
 * AuthProvider component that wraps the app to provide authentication context.
 */
export function AuthProvider({ children }) {
  // Authentication state
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const initialized = useRef(false);

  // Initialize user state from localStorage on mount
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const token = authService.getStoredToken();
    const storedUser = authService.getStoredUser();

    if (token && storedUser) {
      setUser(storedUser);
    }

    setLoading(false);
  }, []);

  /**
   * Registers a new user — creates account as unverified.
   * Returns user info but does NOT set authenticated state yet.
   * @param {Object} userData - { firstName, lastName, email, password }
   */
  const register = async userData => {
    setLoading(true);
    try {
      const { user } = await authService.register(userData);
      // Store user temporarily but don't set as fully authenticated yet
      // (email must be verified first)
      return { success: true, user };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Completes email verification — sets authenticated state with full user info and token.
   * @param {Object} data - { email, code }
   */
  const verifyEmail = async ({ email, code }) => {
    setLoading(true);
    try {
      const { user, token } = await authService.verifyEmail({ email, code });
      setUser(user);
      return { success: true, user, token };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Authenticates a user and updates the session state.
   * @param {Object} credentials - { email, password }
   */
  const login = async credentials => {
    setLoading(true);
    try {
      const { user } = await authService.login(credentials);
      setUser(user);
      return { success: true };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Clears the user session and redirects to the login page.
   */
  const logout = () => {
    authService.logout();
    setUser(null);
    navigate('/auth');
  };

  // Context value with state and methods
  const value = {
    user,
    loading,
    register,
    verifyEmail,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Custom hook to access the authentication context.
 * @throws {Error} If used outside of AuthProvider
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
