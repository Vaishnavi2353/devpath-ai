/**
 * Authentication Provider Component
 * 
 * Manages global user authentication state, session restoration on refresh,
 * login, signup, and logout lifecycles.
 */

import { useState, useEffect, useCallback } from 'react';
import { AuthContext } from './authContextDef';
import { authApi } from '../services/api';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Restore session on initial mount
  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      try {
        const data = await authApi.getCurrentUser();
        if (isMounted && data?.user) {
          setUser(data.user);
        }
      } catch {
        // 401 is normal when visitor is unauthenticated
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const signup = useCallback(async ({ name, email, password }) => {
    setAuthError(null);
    try {
      const data = await authApi.signup({ name, email, password });
      setUser(data.user);
      return data.user;
    } catch (err) {
      setAuthError(err.message || 'Registration failed.');
      throw err;
    }
  }, []);

  const login = useCallback(async ({ email, password }) => {
    setAuthError(null);
    try {
      const data = await authApi.login({ email, password });
      setUser(data.user);
      return data.user;
    } catch (err) {
      setAuthError(err.message || 'Login failed.');
      throw err;
    }
  }, []);

  const googleLogin = useCallback(async (payload) => {
    setAuthError(null);
    try {
      const data = await authApi.googleAuth(payload);
      setUser(data.user);
      return data.user;
    } catch (err) {
      setAuthError(err.message || 'Google sign-in failed.');
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
      setUser(null);
      setAuthError(null);
    } catch (err) {
      console.warn('Logout API error:', err.message);
      setAuthError(err.message || 'Failed to sign out.');
      throw err;
    }
  }, []);

  const clearError = useCallback(() => {
    setAuthError(null);
  }, []);

  const value = {
    user,
    loading,
    authError,
    signup,
    login,
    googleLogin,
    logout,
    clearError,
    isAuthenticated: Boolean(user),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
