
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
    console.log("refreshUser iniciado");
    try {
        const firebaseUser = auth.currentUser;
        if (!firebaseUser) {
            console.log("No hay firebaseUser en refreshUser");
            setUser(null);
            return;
        }

        console.log("Obteniendo usuario de Firestore para UID:", firebaseUser.uid);
        let currentUser = null;
        try {
            currentUser = await api.getCurrentUser();
        } catch (e) {
            console.error("Error al obtener usuario de Firestore en refreshUser:", e);
            // Si falla la red o hay un error, no deslogueamos al usuario inmediatamente
            // Permitimos que la app intente funcionar con el estado básico
        }
        
        if (!currentUser) {
            console.log("Usuario no encontrado en Firestore o error, marcando como needsProfile");
            const isTestUser = firebaseUser.email?.endsWith('@test.com');
            setUser({
                id: firebaseUser.uid,
                email: firebaseUser.email,
                name: firebaseUser.displayName || 'Usuario',
                avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser.uid}`,
                emailVerified: isTestUser ? true : firebaseUser.emailVerified,
                needsProfile: true
            });
        } else {
            console.log("Usuario obtenido de Firestore:", currentUser.id);
            const isTestUser = firebaseUser.email?.endsWith('@test.com');
            if (isTestUser) {
                currentUser.emailVerified = true;
            }
            setUser(currentUser);
        }
    } catch(error) {
        console.error("Fallo crítico al refrescar el usuario", error);
        // Solo ponemos a null si realmente no hay rastro del usuario
        if (!auth.currentUser) setUser(null);
    }
  }, []);

  const login = useCallback(async (newToken, rememberMe = false) => {
    console.log("login(token) llamado");
    setToken(newToken);
    api.setToken(newToken);
    console.log("login(token) delegando a onAuthStateChanged");
  }, []);

  const updateUser = useCallback((updatedUser) => {
    console.log("updateUser llamado", updatedUser?.id);
    setUser(updatedUser);
  }, []);

  useEffect(() => {
    console.log("Configurando onAuthStateChanged");
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("onAuthStateChanged disparado, firebaseUser:", firebaseUser?.uid);
      
      setLoading(true);
      
      if (firebaseUser) {
        const currentToken = await firebaseUser.getIdToken();
        console.log("Token obtenido");
        setToken(currentToken);
        api.setToken(currentToken);
        
        let currentUser = null;
        try {
            console.log("Buscando usuario en Firestore desde onAuthStateChanged", firebaseUser.uid);
            currentUser = await api.getCurrentUser(firebaseUser.uid);
        } catch (e) {
            console.error("Error fetching user from Firestore", e);
        }
        
        if (!currentUser) {
            console.log("Usuario no en Firestore (onAuthStateChanged), needsProfile: true");
            const isTestUser = firebaseUser.email?.endsWith('@test.com');
            setUser({
                id: firebaseUser.uid,
                email: firebaseUser.email,
                name: firebaseUser.displayName || 'Usuario de Prueba',
                avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser.uid}`,
                emailVerified: isTestUser ? true : firebaseUser.emailVerified,
                needsProfile: true
            });
        } else {
            console.log("Usuario en Firestore (onAuthStateChanged):", currentUser.id);
            const isTestUser = firebaseUser.email?.endsWith('@test.com');
            if (isTestUser) {
                currentUser.emailVerified = true;
            }
            setUser(currentUser);
        }
        if (typeof window !== 'undefined') sessionStorage.setItem('active_auth_session', 'true');
      } else {
        console.log("Usuario deslogueado (onAuthStateChanged)");
        setUser(null);
        setToken(null);
        api.setToken(null);
        if (typeof window !== 'undefined') sessionStorage.removeItem('active_auth_session');
      }
      
      setLoading(false);
      console.log("onAuthStateChanged finalizado");
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
