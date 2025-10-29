


import React, { useState, useMemo } from 'react';
import { api } from '../services/api.js';
import { Link, useNavigate } from 'react-router-dom';
import Input from '../components/Input.js';
import Button from '../components/Button.js';
// FIX: Changed import from useAuth.js to useAuth.tsx
import { useAuth } from '../hooks/useAuth.tsx';
import { useColorTheme } from '../hooks/useColorTheme.js';

const PasswordStrengthIndicator = ({ password }) => {
    const checks = useMemo(() => {
        const hasLength = password.length >= 8;
        const hasUpper = /[A-Z]/.test(password);
        const hasLower = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        return { hasLength, hasUpper, hasLower, hasNumber };
    }, [password]);

    const Check = ({ valid, text }) => (
        React.createElement("li", { className: `flex items-center gap-2 text-sm ${valid ? 'text-green-500' : 'text-gray-400'}` },
            React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-4 w-4", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" },
                valid 
                    ? React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M5 13l4 4L19 7" }) 
                    : React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" })
            ),
            text
        )
    );

    return (
        React.createElement("ul", { className: "space-y-1 mt-2" },
            React.createElement(Check, { valid: checks.hasLength, text: "Al menos 8 caracteres" }),
            React.createElement(Check, { valid: checks.hasUpper, text: "Contiene una letra mayúscula" }),
            React.createElement(Check, { valid: checks.hasLower, text: "Contiene una letra minúscula" }),
            React.createElement(Check, { valid: checks.hasNumber, text: "Contiene un número" })
        )
    );
};

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { theme } = useColorTheme();

  const isPasswordValid = useMemo(() => {
    return password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password);
  }, [password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agreedToTerms) {
        setError("Debes aceptar los Términos de Servicio para registrarte.");
        return;
    }
    if (!isPasswordValid) {
        setError("La contraseña no cumple los requisitos de seguridad.");
        return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await api.register(name, email, password);
      const { token } = await api.login(email, password);
      await login(token);
      navigate('/onboarding');
    } catch (err) {
      if (err.message.includes('Ya existe un usuario con este correo')) {
          setError(
              React.createElement("span", null,
                  "Ya existe un usuario con este correo. ¿Has",
                  ' ',
                  React.createElement(Link, { to: "/forgot-password", state: {email}, className: `font-medium ${theme.textColor} ${theme.hoverTextColor}` },
                      "olvidado tu contraseña?"
                  )
              )
          );
      } else {
          setError(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkipLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Pick a random user to login
      const randomUser = Math.random() > 0.5 
        ? { email: 'ana@example.com', pass: 'Password123' } 
        : { email: 'benito@example.com', pass: 'Password456' };
      
      const { token } = await api.login(randomUser.email, randomUser.pass);
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
          "Crea tu cuenta"
        )
      ),
      React.createElement("form", { className: "mt-8 space-y-6", onSubmit: handleSubmit },
        error && React.createElement("div", { className: "text-red-500 text-sm text-center p-2 bg-red-100 dark:bg-red-900/50 rounded-md" }, error),
        React.createElement("div", { className: "rounded-md shadow-sm -space-y-px flex flex-col gap-y-4" },
          React.createElement(Input, { id: "name", label: "Nombre Completo", name: "name", type: "text", autoComplete: "name", required: true, value: name, onChange: (e) => setName(e.target.value), placeholder: "Tu Nombre" }),
          React.createElement(Input, { id: "email-address", label: "Correo electrónico", name: "email", type: "email", autoComplete: "email", required: true, value: email, onChange: (e) => setEmail(e.target.value), placeholder: "Correo electrónico" }),
          React.createElement("div", null,
              React.createElement(Input, { id: "password", label: "Contraseña", name: "password", type: "password", autoComplete: "new-password", required: true, value: password, onChange: (e) => setPassword(e.target.value), placeholder: "Contraseña" }),
              React.createElement(PasswordStrengthIndicator, { password: password })
          ),
          React.createElement(Input, { id: "confirm-password", label: "Confirmar Contraseña", name: "confirm-password", type: "password", autoComplete: "new-password", required: true, value: confirmPassword, onChange: (e) => setConfirmPassword(e.target.value), placeholder: "Confirmar Contraseña" })
        ),
        React.createElement("div", { className: "flex items-start" },
            React.createElement("div", { className: "flex items-center h-5" },
                React.createElement("input", {
                    id: "terms",
                    name: "terms",
                    type: "checkbox",
                    checked: agreedToTerms,
                    onChange: (e) => setAgreedToTerms(e.target.checked),
                    className: `h-4 w-4 rounded border-gray-300 ${theme.textColor} ${theme.focus}`
                })
            ),
            React.createElement("div", { className: "ml-3 text-sm" },
                React.createElement("label", { htmlFor: "terms", className: "font-medium text-gray-700 dark:text-gray-300" },
                    "He leído y acepto los ",
                    React.createElement(Link, {
                        to: "/terms-of-service",
                        target: "_blank",
                        rel: "noopener noreferrer",
                        className: `font-medium ${theme.textColor} ${theme.hoverTextColor} underline`
                    }, "Términos de Servicio")
                )
            )
        ),
        React.createElement("div", null,
// FIX: Pass children as a prop to the Button component to satisfy the type checker.
          React.createElement(Button, { type: "submit", isLoading: isLoading, className: "w-full", disabled: !isPasswordValid || password !== confirmPassword || !agreedToTerms, children: "Crear Cuenta" })
        )
      ),
      React.createElement("p", { className: "mt-2 text-center text-sm text-gray-600 dark:text-gray-400" },
        "¿Ya tienes una cuenta?",
        ' ',
        React.createElement(Link, { to: "/login", className: `font-medium ${theme.textColor} ${theme.hoverTextColor}` },
          "Inicia sesión"
        )
      ),
      React.createElement("div", {className: "mt-4"},
        React.createElement(Button, { 
          onClick: handleSkipLogin, 
          isLoading: isLoading, 
          variant: "secondary",
          className: "w-full", 
          children: "Omitir Registro (Desarrollo)" 
        })
      )
    )
  );
};

export default RegisterPage;