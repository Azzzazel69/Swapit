
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
  const { login } = useAuth();
  const navigate = useNavigate();
  const { theme } = useColorTheme();
  const googleButtonRef = useRef(null);

  const navigateAfterLogin = useCallback(async () => {
      navigate('/', { replace: true });
  }, [navigate]);

  const handleGoogleSignIn = useCallback(async (response: CredentialResponse) => {
    setIsLoading(true);
    setError(null);
    try {
      if (!response.credential) {
          throw new Error("Google Sign-In failed: No credential received.");
      }
      const { token } = await api.loginWithGoogle(response.credential);
      await login(token);
      await navigateAfterLogin();

    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  }, [login, navigateAfterLogin]);

  const handleGoogleMockLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
        const { token } = await (api as any).loginWithGoogleMock();
        await login(token);
        await navigateAfterLogin();
    } catch (err) {
        setError("Error en el inicio de sesión simulado.");
    } finally {
        setIsLoading(false);
    }
  };

  const handleQuickLogin = async (uEmail, uPassword) => {
      setIsLoading(true);
      setError(null);
      try {
          const { token } = await api.login(uEmail, uPassword);
          await login(token);
          await navigateAfterLogin();
      } catch (err) {
          setError(err.message);
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
    setIsLoading(true);
    setError(null);
    try {
      const { token } = await api.login(email, password);
      await login(token);
      await navigateAfterLogin();
    } catch (err)
      {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return React.createElement("div", { className: "flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" },
    React.createElement("div", { className: "max-w-md w-full space-y-8 p-10 bg-white dark:bg-gray-800 rounded-xl shadow-lg" },
      React.createElement("div", null,
        React.createElement("h2", { className: "mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white" },
          "Inicia sesión en tu cuenta"
        )
      ),
      error && React.createElement("p", { className: "text-red-500 text-sm text-center" }, error),
      
      React.createElement("form", { className: "space-y-6", onSubmit: handleSubmit },
        React.createElement("div", { className: "rounded-md shadow-sm -space-y-px flex flex-col gap-y-4" },
          React.createElement(Input, {
            id: "email-address",
            label: "Correo electrónico",
            name: "email",
            type: "email",
            autoComplete: "email",
            required: true,
            value: email,
            onChange: (e) => setEmail(e.target.value),
            placeholder: "Correo electrónico"
          }),
          React.createElement(Input, {
            id: "password",
            label: "Contraseña",
            name: "password",
            type: "password",
            autoComplete: "current-password",
            required: true,
            value: password,
            onChange: (e) => setPassword(e.target.value),
            placeholder: "Contraseña"
          })
        ),
        React.createElement("div", { className: "flex items-center justify-end" },
          React.createElement("div", { className: "text-sm" },
            React.createElement(Link, { to: "/forgot-password", className: `font-medium ${theme.textColor} ${theme.hoverTextColor}` },
              "¿Has olvidado tu contraseña?"
            )
          )
        ),
        React.createElement("div", null,
          React.createElement(Button, { type: "submit", isLoading: isLoading, className: "w-full", children: "Iniciar Sesión" })
        )
      ),

      React.createElement("div", { className: "relative" },
        React.createElement("div", { className: "absolute inset-0 flex items-center" },
          React.createElement("div", { className: "w-full border-t border-gray-300 dark:border-gray-600" })
        ),
        React.createElement("div", { className: "relative flex justify-center text-sm" },
          React.createElement("span", { className: "px-2 bg-white dark:bg-gray-800 text-gray-500" }, "O inicia sesión con")
        )
      ),
      isGoogleScriptLoaded ? (
        React.createElement("div", { className: "flex justify-center pt-4", ref: googleButtonRef })
      ) : googleTimedOut ? (
        React.createElement("div", { className: "flex justify-center pt-4" },
            React.createElement(Button, { onClick: handleGoogleMockLogin, isLoading: isLoading, variant: "secondary", children: "Login con Google (Mock)" })
        )
      ) : (
        React.createElement("div", { className: "flex justify-center pt-4 h-[40px]" }, React.createElement(SwapSpinner, { size: 'md-small' }) )
      ),

      // --- DEV BUTTONS START ---
      React.createElement("div", { className: "mt-8 border-t border-gray-200 dark:border-gray-700 pt-6" },
        React.createElement("h3", { className: "text-center text-xs font-bold text-gray-400 uppercase tracking-wide mb-3" }, "🛠️ Acceso Rápido (Pruebas)"),
        React.createElement("div", { className: "grid grid-cols-2 gap-2" },
            React.createElement(Button, { variant: "secondary", size: "sm", onClick: () => handleQuickLogin('azzazel69@gmail.com', 'AdminPassword123'), className: "bg-yellow-100 dark:bg-yellow-900/50" }, "🛡️ Admin"),
            React.createElement(Button, { variant: "secondary", size: "sm", onClick: () => handleQuickLogin('carlos@test.com', 'password123') }, "👤 Carlos (User)"),
            React.createElement(Button, { variant: "secondary", size: "sm", onClick: () => handleQuickLogin('pedro_troll@test.com', 'password123'), className: "bg-red-50 dark:bg-red-900/20" }, "👹 Pedro (Troll)"),
            React.createElement(Button, { variant: "secondary", size: "sm", onClick: () => handleQuickLogin('scammer@test.com', 'password123'), className: "bg-orange-50 dark:bg-orange-900/20" }, "🤖 Bot (Scammer)")
        )
      ),
      // --- DEV BUTTONS END ---

      React.createElement("p", { className: "mt-2 text-center text-sm text-gray-600 dark:text-gray-400" },
        "¿No tienes una cuenta?",
        ' ',
        React.createElement(Link, { to: "/register", className: `font-medium ${theme.textColor} ${theme.hoverTextColor}` },
          "Crea una aquí"
        )
      )
    )
  );
};

export default LoginPage;
