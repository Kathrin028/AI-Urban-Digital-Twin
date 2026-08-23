import { useState } from 'react';
import { ThemeContext } from './ThemeContext';

/**
 * ThemeProvider – provides theme mode and toggle function via ThemeContext.
 */
export const ThemeProvider = ({ children }) => {
  const [mode, setMode] = useState('light'); // default light; can be 'dark' or 'system'

  const toggleTheme = (newMode) => {
    setMode(newMode);
  };

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
