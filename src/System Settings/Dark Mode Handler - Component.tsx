import React, { createContext, useContext, ReactNode } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { lightTheme, darkTheme } from './Color Themes';
import { useSettings } from './Settings Manager - Component';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  mode: ThemeMode;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface AppThemeProviderProps {
  children: ReactNode;
}

export const AppThemeProvider: React.FC<AppThemeProviderProps> = ({ children }) => {
  const { settings, updateSetting } = useSettings();

  const toggleTheme = () => {
    updateSetting('themeMode', settings.themeMode === 'light' ? 'dark' : 'light');
  };

  const theme = settings.themeMode === 'light' ? lightTheme : darkTheme;

  return (
    <ThemeContext.Provider value={{ mode: settings.themeMode, toggleTheme }}>
      <ThemeProvider theme={theme}>
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};