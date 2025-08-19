import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  // Background colors
  background: string;
  surface: string;
  surfaceVariant: string;
  
  // Text colors
  text: string;
  textSecondary: string;
  textTertiary: string;
  
  // Interactive elements
  primary: string;
  primaryVariant: string;
  secondary: string;
  accent: string;
  
  // Status colors
  success: string;
  error: string;
  warning: string;
  info: string;
  
  // Border and divider colors
  border: string;
  divider: string;
  
  // Input and form colors
  inputBackground: string;
  inputBorder: string;
  inputPlaceholder: string;
  
  // Card and modal colors
  card: string;
  modal: string;
  
  // Overlay colors
  overlay: string;
  shadow: string;
}

interface ThemeContextType {
  theme: ThemeColors;
  themeMode: ThemeMode;
  isDark: boolean;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
}

const lightTheme: ThemeColors = {
  // Background colors
  background: '#f5f5f5',
  surface: '#ffffff',
  surfaceVariant: '#f8f9fa',
  
  // Text colors
  text: '#333333',
  textSecondary: '#666666',
  textTertiary: '#999999',
  
  // Interactive elements
  primary: '#007AFF',
  primaryVariant: '#0056CC',
  secondary: '#6c757d',
  accent: '#FF6B35',
  
  // Status colors
  success: '#28a745',
  error: '#dc3545',
  warning: '#ffc107',
  info: '#17a2b8',
  
  // Border and divider colors
  border: '#dddddd',
  divider: '#e9ecef',
  
  // Input and form colors
  inputBackground: '#ffffff',
  inputBorder: '#dddddd',
  inputPlaceholder: '#999999',
  
  // Card and modal colors
  card: '#ffffff',
  modal: '#ffffff',
  
  // Overlay colors
  overlay: 'rgba(0, 0, 0, 0.1)',
  shadow: 'rgba(0, 0, 0, 0.1)',
};

const darkTheme: ThemeColors = {
  // Background colors
  background: '#121212',
  surface: '#1e1e1e',
  surfaceVariant: '#2d2d2d',
  
  // Text colors
  text: '#ffffff',
  textSecondary: '#b3b3b3',
  textTertiary: '#808080',
  
  // Interactive elements
  primary: '#0A84FF',
  primaryVariant: '#0056CC',
  secondary: '#8e8e93',
  accent: '#FF9F0A',
  
  // Status colors
  success: '#30d158',
  error: '#ff453a',
  warning: '#ffd60a',
  info: '#64d2ff',
  
  // Border and divider colors
  border: '#38383a',
  divider: '#38383a',
  
  // Input and form colors
  inputBackground: '#2d2d2d',
  inputBorder: '#38383a',
  inputPlaceholder: '#808080',
  
  // Card and modal colors
  card: '#1e1e1e',
  modal: '#1e1e1e',
  
  // Overlay colors
  overlay: 'rgba(255, 255, 255, 0.1)',
  shadow: 'rgba(0, 0, 0, 0.3)',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    loadThemeMode();
  }, []);

  useEffect(() => {
    const shouldBeDark = 
      themeMode === 'dark' || 
      (themeMode === 'system' && systemColorScheme === 'dark');
    setIsDark(shouldBeDark);
  }, [themeMode, systemColorScheme]);

  const loadThemeMode = async () => {
    try {
      const savedThemeMode = await AsyncStorage.getItem('themeMode');
      if (savedThemeMode) {
        setThemeModeState(savedThemeMode as ThemeMode);
      }
    } catch (error) {
      console.error('Error loading theme mode:', error);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem('themeMode', mode);
      setThemeModeState(mode);
    } catch (error) {
      console.error('Error saving theme mode:', error);
    }
  };

  const toggleTheme = () => {
    const newMode = isDark ? 'light' : 'dark';
    setThemeMode(newMode);
  };

  const theme = isDark ? darkTheme : lightTheme;

  const value = {
    theme,
    themeMode,
    isDark,
    toggleTheme,
    setThemeMode,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
