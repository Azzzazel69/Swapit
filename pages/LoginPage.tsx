



import React, { useState } from 'react';
// FIX: Changed import from useAuth.js to useAuth.tsx
import { useAuth } from '../hooks/useAuth.tsx';
import { api } from '../services/api.js';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Input from '../components/Input.js';
import Button from '../components/Button.js';
import { useColorTheme } from '../hooks/useColorTheme.js';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { theme } = useColorTheme();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const { token } = await api.login(email, password);
      await login(token);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDevLogin = async (userEmail, userPass) => {
    setIsLoading(true);
    setError(null);
    try {
      const { token } = await api.login(userEmail, userPass);
      await login(token);
      navigate('/');
    } catch (err) {
      setError("Error en el inicio de sesión de desarrollo.");
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
      React.createElement("form", { className: "mt-8 space-y-6", onSubmit: handleSubmit },
        error && React.createElement("p", { className: "text-red-500 text-sm text-center" }, error),
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
// FIX: Pass children as a prop to the Button component to satisfy the type checker.
          React.createElement(Button, { type: "submit", isLoading: isLoading, className: "w-full", children: "Iniciar Sesión" })
        )
      ),
      React.createElement("p", { className: "mt-2 text-center text-sm text-gray-600 dark:text-gray-400" },
        "O",
        ' ',
        React.createElement(Link, { to: "/register", className: `font-medium ${theme.textColor} ${theme.hoverTextColor}` },
          "crea una nueva cuenta"
        )
      ),
      React.createElement("div", {className: "mt-6 border-t pt-4 space-y-2"},
        React.createElement("p", {className: "text-center text-xs text-gray-500"}, "ACCESO RÁPIDO (DESARROLLO)"),
        React.createElement(Button, { onClick: () => handleDevLogin('ana@example.com', 'Password123'), isLoading: isLoading, variant: "secondary", className: "w-full", children: "Entrar como Ana" }),
        React.createElement(Button, { onClick: () => handleDevLogin('benito@example.com', 'Password456'), isLoading: isLoading, variant: "secondary", className: "w-full", children: "Entrar como Benito" }),
        React.createElement(Button, { onClick: () => handleDevLogin('admin@example.com', 'AdminPassword123'), isLoading: isLoading, variant: "secondary", className: "w-full", children: "Entrar como Admin" })
      )
    )
  );
};

export default LoginPage;