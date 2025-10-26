
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
  updateUser: (updatedUser: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('jwt_token');
    api.setToken(null);
  }, []);

  const login = useCallback(async (newToken: string) => {
    localStorage.setItem('jwt_token', newToken);
    setToken(newToken);
    api.setToken(newToken);
    try {
      const currentUser = await api.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Failed to fetch user on login:', error);
      logout(); // Logout if user fetch fails
    }
  }, [logout]);

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      const storedToken = localStorage.getItem('jwt_token');
      if (storedToken) {
        try {
          await login(storedToken);
        } catch (error) {
          // Token might be expired or invalid
          logout();
        }
      }
      setLoading(false);
    };
    initAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // FIX: The file has a .ts extension but contained JSX, which caused parsing errors. Replaced JSX with React.createElement to make it valid TypeScript.
  return React.createElement(AuthContext.Provider, { value: { user, token, loading, login, logout, updateUser } }, children);
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
