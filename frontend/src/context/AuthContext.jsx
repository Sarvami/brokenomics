/**
 * AuthContext — manages JWT token in memory, user state,
 * and auth modal visibility.
 * Token is NEVER written to localStorage.
 */

import { createContext, useContext, useState, useCallback } from 'react';
import { authAPI, setAuthToken, clearAuthToken } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null); // in-memory only
  const [isGuest, setIsGuest] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isAuthenticated = !!token;

  /**
   * Persist token in memory and update module-level ref in api.js
   */
  const persistToken = useCallback((newToken) => {
    setToken(newToken);
    setAuthToken(newToken);
  }, []);

  /**
   * Login with email + password
   */
  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authAPI.login(email, password);
      persistToken(data.access_token);
      setIsGuest(false);
      // Fetch user profile
      const profile = await authAPI.getCurrentUser();
      setUser(profile);
      setAuthModalOpen(false);
      return { success: true };
    } catch (err) {
      setError(err.message || 'Login failed. Check your credentials.');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [persistToken]);

  /**
   * Register a new account
   */
  const register = useCallback(async (email, password, firstName, lastName) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authAPI.register(email, password, firstName, lastName);
      persistToken(data.access_token);
      setIsGuest(false);
      const profile = await authAPI.getCurrentUser();
      setUser(profile);
      setAuthModalOpen(false);
      return { success: true };
    } catch (err) {
      setError(err.message || 'Registration failed. Try again.');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [persistToken]);

  /**
   * Start a guest session (no signup needed).
   * If the API is unreachable, silently falls back to a local guest state
   * so the user can still browse the app without an error.
   */
  const startGuestSession = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await authAPI.createGuestSession();
      persistToken(data.access_token);
      setIsGuest(true);
      setUser({ name: 'Guest', email: null });
      setAuthModalOpen(false);
      return { success: true };
    } catch {
      // Backend not running — silently proceed as a local guest.
      // No token, no error shown to user.
      setIsGuest(true);
      setUser({ name: 'Guest', email: null });
      setAuthModalOpen(false);
      return { success: true };
    } finally {
      setLoading(false);
    }
  }, [persistToken]);

  /**
   * Logout
   */
  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    setIsGuest(false);
    clearAuthToken();
  }, []);

  /**
   * Open auth modal — optionally specify mode
   * Call this when user tries to access a protected feature
   */
  const requireAuth = useCallback((mode = 'login') => {
    if (!isAuthenticated) {
      setAuthMode(mode);
      setAuthModalOpen(true);
      return false; // not authenticated, modal opened
    }
    return true; // already authenticated
  }, [isAuthenticated]);

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated,
      isGuest,
      authModalOpen,
      authMode,
      loading,
      error,
      login,
      register,
      startGuestSession,
      logout,
      requireAuth,
      setAuthModalOpen,
      setAuthMode,
      setError,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
