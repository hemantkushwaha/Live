import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../../shared/types';
import { ApiSuccessResponse } from '../../shared/helpers/response';
import { apiClient } from '../config/api';

interface AuthSessionData {
  user: User;
  token: string;
  loginTimestamp?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'liveconnect_session_token';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Restore session on mount
  useEffect(() => {
    const restoreSession = async () => {
      const savedToken = sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
      if (!savedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await apiClient.get<ApiSuccessResponse<AuthSessionData>>('/auth/me');
        if (response.data?.data) {
          const { user: restoredUser, token: restoredToken } = response.data.data;
          setUser(restoredUser);
          setToken(restoredToken || savedToken);
          sessionStorage.setItem(TOKEN_KEY, restoredToken || savedToken);
        } else {
          // Token invalid or session expired
          sessionStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(TOKEN_KEY);
        }
      } catch {
        sessionStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(TOKEN_KEY);
        setUser(null);
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (email: string) => {
    setError(null);
    try {
      const response = await apiClient.post<ApiSuccessResponse<AuthSessionData>>('/auth/login', { email });
      const sessionData = response.data.data;

      if (sessionData && sessionData.user && sessionData.token) {
        setUser(sessionData.user);
        setToken(sessionData.token);
        sessionStorage.setItem(TOKEN_KEY, sessionData.token);
      } else {
        throw new Error('Invalid response structure from server');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Authentication failed. Please check your email.';
      setError(msg);
      throw new Error(msg);
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await apiClient.post('/auth/logout');
      }
    } catch {
      // Ignore errors on logout
    } finally {
      sessionStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(TOKEN_KEY);
      setUser(null);
      setToken(null);
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        error,
        login,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
