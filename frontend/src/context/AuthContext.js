import { createContext } from 'react';

/**
 * AuthContext – provides authenticated user state and auth actions.
 *
 * Shape:
 *   user          – object | null
 *   isLoading     – boolean (true while restoring session on mount)
 *   isAuthenticated – boolean
 *   login(credentials) – async
 *   register(data)     – async
 *   logout()           – async
 */
export const AuthContext = createContext({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
});
