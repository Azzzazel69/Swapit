import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
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

  const login = useCallback(async (newToken) => {
    if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('jwt_token', newToken);
    }
    setToken(newToken);
    api.setToken(newToken);
    try {
      const currentUser = await api.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Fallo al obtener el usuario al iniciar sesión:', error);
      logout(); // Logout if user fetch fails
    }
  }, [logout]);

  const refreshUser = async () => {
    try {
        const currentUser = await api.getCurrentUser();
        setUser(currentUser);
    } catch(error) {
        console.error("Fallo al refrescar el usuario", error);
        logout();
    }
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      let storedToken = null;
      if (typeof window !== 'undefined' && window.localStorage) {
        storedToken = window.localStorage.getItem('jwt_token');
      }

      if (storedToken) {
        try {
          setToken(storedToken);
          api.setToken(storedToken);
          await refreshUser();
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


  return React.createElement(AuthContext.Provider, { value: { user, token, loading, login, logout, updateUser, refreshUser } },
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