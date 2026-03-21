
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth.tsx';
import { api } from '../services/api.ts';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Input from '../components/Input.tsx';
import Button from '../components/Button.tsx';
import { useColorTheme } from '../hooks/useColorTheme.tsx';
import SwapSpinner from '../components/SwapSpinner.tsx';

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
  const [isGoogleScriptLoaded, setIsGoogleScriptLoaded] = useState(false);
  const [googleTimedOut, setGoogleTimedOut] = useState(false);
  const { login, user, loading } = useAuth();
  const navigate = useNavigate();
  const { theme } = useColorTheme();
  const googleButtonRef = useRef(null);

  useEffect(() => {
    if (!loading && user) {
      console.log("Usuario ya logueado detectado en LoginPage, redirigiendo...");
      navigate('/', { replace: true });
    }
  }, [user, loading, navigate]);

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
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 p-10 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
              Bienvenido a Swapit
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
              Inicia sesión para continuar
            </p>
          </div>

          {error && <p className="text-red-500 text-sm text-center bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">{error}</p>}
          
          <div className="flex flex-col gap-6">
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="rounded-md shadow-sm -space-y-px flex flex-col gap-y-4">
                <Input
                  id="email-address"
                  label="Correo electrónico"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Correo electrónico"
                />
                <Input
                  id="password"
                  label="Contraseña"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Contraseña"
                />
              </div>

              <div className="flex items-center justify-end">
                <div className="text-sm">
                  <Link to="/forgot-password" className={`font-medium ${theme.textColor} ${theme.hoverTextColor}`}>
                    ¿Has olvidado tu contraseña?
                  </Link>
                </div>
              </div>

              <div>
                <Button type="submit" isLoading={isLoading} className="w-full" variant="primary">
                  Iniciar Sesión
                </Button>
              </div>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">O continuar con</span>
              </div>
            </div>

            <div className="flex justify-center">
              <Button variant="secondary" onClick={handleGoogleSignIn} className="w-full flex justify-center items-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google
              </Button>
            </div>
            
            <div className="mt-2 text-center text-sm">
              <span className="text-gray-600 dark:text-gray-400">¿No tienes cuenta? </span>
              <Link to="/register" className={`font-bold ${theme.textColor} ${theme.hoverTextColor}`}>
                Registrarse
              </Link>
            </div>
          </div>

          {/* --- DEV BUTTONS START --- */}
          {/* Demo logins removed for security as requested by user */}
          {/* --- DEV BUTTONS END --- */}
        </div>
      </div>
    );
  };
  
  export default LoginPage;
