import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

/**
 * useAuth – consume AuthContext values anywhere in the component tree.
 *
 * Returns: { user, isLoading, isAuthenticated, login, register, logout }
 */
export const useAuth = () => useContext(AuthContext);
