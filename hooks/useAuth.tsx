
import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import { api } from '../services/api.ts';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem('jwt_token');
    }
    api.setToken(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
        const currentUser = await api.getCurrentUser();
        setUser(currentUser);
    } catch(error) {
        console.error("Fallo al refrescar el usuario", error);
        logout();
        throw error; // Re-throw to allow callers to handle it
    }
  }, [logout]);

  const login = useCallback(async (newToken) => {
    if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('jwt_token', newToken);
    }
    setToken(newToken);
    api.setToken(newToken);
    try {
      await refreshUser();
    } catch (error) {
      console.error('Fallo al obtener el usuario al iniciar sesión:', error);
      // logout() is already called inside refreshUser on failure
    }
  }, [refreshUser]);

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      let storedToken = null;
      if (typeof window !== 'undefined' && window.localStorage) {
        storedToken = window.localStorage.getItem('jwt_token');
      }

      if (storedToken) {
        api.setToken(storedToken);
        setToken(storedToken);
        try {
          await refreshUser();
        } catch (error) {
          // Token might be expired or invalid. 
          // `refreshUser` already called `logout`.
        }
      }
      setLoading(false);
    };
    initAuth();
  }, [refreshUser]);

  const value = useMemo(() => ({ user, token, loading, login, logout, updateUser, refreshUser }), 
    [user, token, loading, login, logout, updateUser, refreshUser]
  );

  return React.createElement(AuthContext.Provider, { value: value },
      children
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
