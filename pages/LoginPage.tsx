
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth.tsx';
import { api } from '../services/api.ts';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Input from '../components/Input.tsx';
import Button from '../components/Button.tsx';
import { useColorTheme } from '../hooks/useColorTheme.tsx';
import SwapSpinner from '../components/SwapSpinner.tsx';
import { useToast } from '../hooks/useToast.tsx';
import DevTools from '../components/DevTools.tsx';

// This is a placeholder Client ID. For a production application, you must create your own in the Google Cloud Console.
const GOOGLE_CLIENT_ID = "1028313539190-e5cih2p67j6c9t2k333ife2fr5f52g4o.apps.googleusercontent.com";

// Add type definitions for the Google Identity Services library to the global window object.
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (response: CredentialResponse) => void; }) => void;
          renderButton: (parent: HTMLElement, options: object) => void;
        };
      };
    };
  }
}

// Define the type for the Google Sign-In response.
interface CredentialResponse {
  credential?: string;
}

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDatabaseSeeded, setIsDatabaseSeeded] = useState(false);
  const [isGoogleScriptLoaded, setIsGoogleScriptLoaded] = useState(false);
  const [googleTimedOut, setGoogleTimedOut] = useState(false);
  const { login, user, loading } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { theme } = useColorTheme();
  const googleButtonRef = useRef(null);

  useEffect(() => {
    if (!loading && user) {
      console.log("Usuario ya logueado detectado en LoginPage, redirigiendo...");
      navigate('/', { replace: true });
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const checkSeeded = async () => {
      // First check localStorage for speed
      if (localStorage.getItem('swapit_db_seeded') === 'true') {
        setIsDatabaseSeeded(true);
        return;
      }
      
      // Then check Firestore if possible (might fail if unauthenticated)
      try {
        const { doc, getDoc } = await import('firebase/firestore');
        const { db } = await import('../firebase');
        const docRef = doc(db, 'system', 'status');
        const snap = await getDoc(docRef);
        if (snap.exists() && snap.data()?.seeded) {
          setIsDatabaseSeeded(true);
          localStorage.setItem('swapit_db_seeded', 'true');
        }
      } catch (e) {
        console.error("Error checking if database is seeded:", e);
      }
    };
    checkSeeded();
  }, []);

  const navigateAfterLogin = useCallback(async () => {
      navigate('/', { replace: true });
  }, [navigate]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { token } = await api.loginWithGoogle();
      await login(token, true);
      await navigateAfterLogin();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };


  useEffect(() => {
    let timeoutId: any;

    if (window.google?.accounts?.id) {
        setIsGoogleScriptLoaded(true);
        return;
    }
    const script = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (script) {
        const handleLoad = () => {
            clearTimeout(timeoutId);
            setIsGoogleScriptLoaded(true);
        };
        script.addEventListener('load', handleLoad);
        if (window.google?.accounts?.id) {
            handleLoad();
        } else {
            timeoutId = setTimeout(() => {
                if (!window.google?.accounts?.id) {
                    setGoogleTimedOut(true);
                }
            }, 3000);
        }
        return () => {
            script.removeEventListener('load', handleLoad);
            clearTimeout(timeoutId);
        }
    } else {
        setGoogleTimedOut(true);
    }
  }, []);

  useEffect(() => {
    if (isGoogleScriptLoaded && googleButtonRef.current && googleButtonRef.current.childElementCount === 0) {
        window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleSignIn,
        });
        window.google.accounts.id.renderButton(
            googleButtonRef.current,
            { theme: 'outline', size: 'large', type: 'standard', text: 'signin_with', shape: 'rectangular' }
        );
    }
  }, [isGoogleScriptLoaded, handleGoogleSignIn]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Iniciando sesión para:", email);
    setIsLoading(true);
    setError(null);
    try {
      const { token } = await api.login(email, password);
      console.log("Login exitoso en Firebase Auth");
      await login(token, true);
      console.log("Usuario refrescado en el estado de la app");
      await navigateAfterLogin();
      console.log("Navegación post-login iniciada");
    } catch (err) {
      console.error("Error durante el login:", err);
      if (err.message.includes('Demasiados intentos')) {
          setError('⛔ Firebase ha bloqueado tu IP temporalmente por demasiados intentos. Por favor, espera entre 1 y 3 minutos antes de volver a ingresar.');
      } else {
          setError(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
      <div className="relative flex flex-col items-center justify-center min-h-[100dvh] px-4 overflow-hidden bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500">
        
        {/* Abstract background shapes */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] fill-emerald-300 opacity-60 transform rotate-12 blur-3xl"></svg>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] fill-cyan-400 opacity-60 transform -rotate-12 blur-3xl"></svg>
        </div>

        <div className="z-10 w-full max-w-sm">
            <h1 className="text-4xl font-black text-center text-white tracking-tighter mb-8 shadow-sm">
                SWAP<span className="text-emerald-100">IT</span>
            </h1>
            
            <div className="bg-white rounded-3xl shadow-2xl p-8 space-y-6">
                <div className="text-center">
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Bienvenido de nuevo</h2>
                    <p className="text-sm text-slate-500 mt-1">Inicia sesión para seguir intercambiando</p>
                </div>

                {error && (
                    <div className="text-red-500 text-xs text-center bg-red-50 p-3 rounded-xl flex flex-col gap-2">
                        <p>{error}</p>
                    </div>
                )}
                
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="space-y-3">
                        <input
                            id="email-address"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Correo electrónico"
                            className="w-full px-5 py-3.5 bg-transparent border-2 border-slate-200 rounded-full text-sm focus:outline-none focus:border-teal-500 focus:ring-0 transition-colors text-slate-800 placeholder-slate-400"
                        />
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Contraseña"
                            className="w-full px-5 py-3.5 bg-transparent border-2 border-slate-200 rounded-full text-sm focus:outline-none focus:border-teal-500 focus:ring-0 transition-colors text-slate-800 placeholder-slate-400"
                        />
                    </div>

                    <div className="flex justify-end pr-2">
                        <Link to="/forgot-password" className="text-sm font-bold text-teal-600 hover:text-teal-700">
                            ¿Olvidaste tu contraseña?
                        </Link>
                    </div>

                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-400 to-cyan-500 hover:from-emerald-500 hover:to-cyan-600 text-white font-bold rounded-full shadow-lg hover:shadow-xl transition-all active:scale-[0.98] disabled:opacity-70"
                    >
                        {isLoading ? <SwapSpinner size="sm" /> : "Iniciar sesión"}
                    </button>
                </form>

                <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-white text-slate-400">O continúa con</span>
                    </div>
                </div>

                <button 
                    onClick={handleGoogleSignIn} 
                    className="w-full py-3.5 px-4 bg-white border-2 border-slate-200 text-slate-700 font-bold rounded-full hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Continuar con Google
                </button>
            </div>

            <div className="mt-8 text-center text-sm font-medium text-white/90">
                <span>¿No tienes cuenta? </span>
                <Link to="/register" className="font-bold text-white hover:underline">
                    Regístrate
                </Link>
            </div>
            
            <div className="mt-8">
                <DevTools />
            </div>
        </div>
      </div>
    );
  };
  
  export default LoginPage;
