import { createContext } from 'react';

/**
 * ThemeContext – provides theme mode (light | dark | system) and a toggle.
 */
export const ThemeContext = createContext({
  mode: 'light',
  toggleTheme: () => {},
});
