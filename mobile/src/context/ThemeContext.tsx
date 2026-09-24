import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { darkPalette, lightPalette, ThemeColors } from '../constants/theme';

export type ThemeMode = 'dark' | 'light' | 'system';

interface ThemeContextType {
  themeMode: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

const THEME_STORAGE_KEY = 'pickngo_user_theme_mode';

export const ThemeContext = createContext<ThemeContextType>({
  themeMode: 'dark',
  isDark: true,
  colors: darkPalette,
  setThemeMode: async () => {},
  toggleTheme: async () => {},
});

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  // Default to Dark Mode to match the brand
  const [themeMode, setThemeModeState] = useState<ThemeMode>('dark');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    async function loadTheme() {
      try {
        const saved = await SecureStore.getItemAsync(THEME_STORAGE_KEY);
        if (saved && (saved === 'dark' || saved === 'light' || saved === 'system')) {
          setThemeModeState(saved as ThemeMode);
        }
      } catch (err) {
        console.warn('[ThemeContext] Failed to load theme mode:', err);
      } finally {
        setIsLoaded(true);
      }
    }

    loadTheme();
  }, []);

  const isDark =
    themeMode === 'system'
      ? systemColorScheme === 'dark'
      : themeMode === 'dark';

  const colors = isDark ? darkPalette : lightPalette;

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      await SecureStore.setItemAsync(THEME_STORAGE_KEY, mode);
    } catch (err) {
      console.warn('[ThemeContext] Failed to save theme mode:', err);
    }
  };

  const toggleTheme = async () => {
    const nextMode = isDark ? 'light' : 'dark';
    await setThemeMode(nextMode);
  };

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        isDark,
        colors,
        setThemeMode,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
