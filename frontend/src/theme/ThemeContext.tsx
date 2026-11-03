import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeMode = 'dark' | 'light';

interface ThemeContextType {
  mode: ThemeMode;
  toggleThemeMode: () => void;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'dark',
  toggleThemeMode: () => {},
  setThemeMode: () => {},
});

export const useThemeMode = () => useContext(ThemeContext);

export const ThemeModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('commentary_journal_theme_mode');
    return saved === 'light' || saved === 'dark' ? saved : 'dark';
  });

  useEffect(() => {
    localStorage.setItem('commentary_journal_theme_mode', mode);
    document.documentElement.setAttribute('data-theme', mode);
    const faviconLink = document.getElementById('app-favicon') as HTMLLinkElement | null;
    if (faviconLink) {
      faviconLink.href = mode === 'dark' ? '/favicon-dark.png' : '/favicon-light.png';
    }
  }, [mode]);

  const toggleThemeMode = () => {
    setMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider value={{ mode, toggleThemeMode, setThemeMode: setMode }}>
      {children}
    </ThemeContext.Provider>
  );
};
