/**
 * @file Theme context for dark/light mode switching.
 *
 * Persists the user's theme preference in localStorage and applies
 * a `data-theme` attribute to the document root so CSS variables
 * can switch between light and dark palettes.
 */

import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

/**
 * ThemeProvider wraps the app and provides theme state + toggle function.
 * Reads the initial theme from localStorage (defaults to 'light').
 */
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('evangadi-theme');
    return saved || 'light';
  });

  /** Sync the data-theme attribute and localStorage whenever theme changes. */
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('evangadi-theme', theme);
  }, [theme]);

  /** Toggle between light and dark themes. */
  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Custom hook to access theme state and toggle function.
 * @throws {Error} If used outside of a ThemeProvider.
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
