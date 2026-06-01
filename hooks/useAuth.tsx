
import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import { api } from '../services/api';
import { auth } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      setUser(null);
      setToken(null);
      api.setToken(null);
    } catch (error) {
      console.error("Error signing out", error);
    }
  }, []);

  const refreshUser = useCallback(async () => {

    try {
        const firebaseUser = auth.currentUser;
        if (!firebaseUser) {

            setUser(null);
            return;
        }


        let currentUser = null;
        try {
            currentUser = await api.getCurrentUser();
        } catch (e) {
            console.error("Error al obtener usuario de Firestore en refreshUser:", e);
            // Si falla la red o hay un error, no deslogueamos al usuario inmediatamente
            // Permitimos que la app intente funcionar con el estado básico
        }
        
        if (!currentUser) {

            setUser({
                id: firebaseUser.uid,
                email: firebaseUser.email,
                name: firebaseUser.displayName || 'Usuario',
                avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser.uid}`,
                emailVerified: firebaseUser.emailVerified,
                needsProfile: true
            });
        } else {

            setUser(currentUser);
        }
    } catch(error) {
        console.error("Fallo crítico al refrescar el usuario", error);
        // Solo ponemos a null si realmente no hay rastro del usuario
        if (!auth.currentUser) setUser(null);
    }
  }, []);

  const login = useCallback(async (newToken, rememberMe = false) => {

    setToken(newToken);
    api.setToken(newToken);

  }, []);

  const updateUser = useCallback((updatedUser) => {

    setUser(updatedUser);
  }, []);

  useEffect(() => {

    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {

      
      setLoading(true);
      
      if (firebaseUser) {
        const currentToken = await firebaseUser.getIdToken();

        setToken(currentToken);
        api.setToken(currentToken);
        
        let currentUser = null;
        try {

            currentUser = await api.getCurrentUser(firebaseUser.uid);
        } catch (e) {
            console.error("Error fetching user from Firestore", e);
        }
        
        if (!currentUser) {

            // For fallback, use the displayName, or split the email, instead of "Usuario de Prueba"
            const fallbackName = firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'Usuario');
            setUser({
                id: firebaseUser.uid,
                email: firebaseUser.email,
                name: fallbackName,
                avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${fallbackName}`,
                emailVerified: firebaseUser.emailVerified,
                needsProfile: true
            });
        } else {

            setUser(currentUser);
        }
        if (typeof window !== 'undefined') sessionStorage.setItem('active_auth_session', 'true');
      } else {

        setUser(null);
        setToken(null);
        api.setToken(null);
        if (typeof window !== 'undefined') sessionStorage.removeItem('active_auth_session');
      }
      
      setLoading(false);

    });

    return () => unsubscribe();
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
