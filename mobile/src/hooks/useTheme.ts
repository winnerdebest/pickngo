import { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';

/**
 * Hook to access current theme state, colors, and toggle functions
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
