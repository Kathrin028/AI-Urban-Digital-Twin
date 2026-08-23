import { useState, useEffect, useCallback } from 'react';
import { AuthContext } from './AuthContext';
import * as authService from '../services/authService';

/**
 * AuthProvider – wraps the app and supplies auth state via AuthContext.
 *
 * On mount it restores any persisted session from localStorage so that
 * a page refresh does not log the user out.
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on initial mount
  useEffect(() => {
    authService.getCurrentUser().then((restoredUser) => {
      setUser(restoredUser);
      setIsLoading(false);
    });
  }, []);

  const login = useCallback(async (credentials) => {
    const { user: loggedIn } = await authService.login(credentials);
    setUser(loggedIn);
    return loggedIn;
  }, []);

  const register = useCallback(async (data) => {
    const { user: registered } = await authService.register(data);
    setUser(registered);
    return registered;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
