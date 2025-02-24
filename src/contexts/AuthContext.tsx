import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, AuthError } from '../lib/types/auth';
import { AuthService } from '../lib/services/auth';
import { SessionManager } from '../lib/utils/sessionManager';
import { TokenManager } from '../lib/utils/tokenManager';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: AuthError | null;
  requires2FA: boolean;
  is2FAEnabled: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  validateResetToken: (token: string) => Promise<boolean>;
  setup2FA: () => Promise<{ qrCode: string; backupCodes: string[] }>;
  verify2FA: (code: string) => Promise<boolean>;
  validate2FACode: (code: string) => Promise<void>;
  disable2FA: (code: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const authService = new AuthService();
const sessionManager = SessionManager.getInstance();
const tokenManager = TokenManager.getInstance();

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);
  const [requires2FA, setRequires2FA] = useState(false);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);

  useEffect(() => {
    const unsubscribe = sessionManager.onSessionChange((user) => {
      setUser(user);
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const { token, requires2FA: requires2FAAuth } = await authService.login(email, password);
      
      if (requires2FAAuth) {
        setRequires2FA(true);
        return;
      }
      
      await tokenManager.setToken(token);
      const userData = await authService.getCurrentUser();
      setUser(userData);
      setIs2FAEnabled(userData.is2FAEnabled || false);
    } catch (err) {
      setError(err as AuthError);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (email: string, password: string, username: string) => {
    try {
      setError(null);
      setIsLoading(true);
      const user = await authService.register(email, password, username);
      await sessionManager.startSession(user);
    } catch (err) {
      setError(err as AuthError);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      await sessionManager.endSession();
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    try {
      setError(null);
      await authService.resetPassword(email);
    } catch (err) {
      setError(err as AuthError);
      throw err;
    }
  }, []);

  const updateProfile = useCallback(async (data: Partial<User>) => {
    try {
      setError(null);
      setIsLoading(true);
      const updatedUser = await authService.updateProfile(data);
      await sessionManager.updateUser(updatedUser);
    } catch (err) {
      setError(err as AuthError);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const validateResetToken = useCallback(async (token: string) => {
    try {
      return await authService.validateResetToken(token);
    } catch (err) {
      setError(err as AuthError);
      throw err;
    }
  }, []);

  const setup2FA = useCallback(async () => {
    try {
      const result = await authService.setup2FA();
      setIs2FAEnabled(true);
      return result;
    } catch (err) {
      setError(err as AuthError);
      throw err;
    }
  }, []);

  const verify2FA = useCallback(async (code: string) => {
    try {
      return await authService.verify2FA(code);
    } catch (err) {
      setError(err as AuthError);
      throw err;
    }
  }, []);

  const validate2FACode = useCallback(async (code: string) => {
    try {
      const { token } = await authService.validate2FACode(code);
      await tokenManager.setToken(token);
      setRequires2FA(false);
    } catch (err) {
      setError(err as AuthError);
      throw err;
    }
  }, []);

  const disable2FA = useCallback(async (code: string) => {
    try {
      const result = await authService.disable2FA(code);
      if (result) {
        setIs2FAEnabled(false);
      }
      return result;
    } catch (err) {
      setError(err as AuthError);
      throw err;
    }
  }, []);

  const value = {
    user,
    isLoading,
    error,
    requires2FA,
    is2FAEnabled,
    login,
    register,
    logout,
    resetPassword,
    updateProfile,
    validateResetToken,
    setup2FA,
    verify2FA,
    validate2FACode,
    disable2FA
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}