

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Input from '../components/Input.js';
import Button from '../components/Button.js';
import { api } from '../services/api.js';
import { useColorTheme } from '../hooks/useColorTheme.js';

const ForgotPasswordPage = () => {
    const { theme } = useColorTheme();
    const location = useLocation();
    const [email, setEmail] = useState(location.state?.email || '');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setMessage('');
        try {
            const response = await api.requestPasswordReset(email);
            setMessage(response.message);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return React.createElement("div", { className: "flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" },
        React.createElement("div", { className: "max-w-md w-full space-y-8 p-10 bg-white dark:bg-gray-800 rounded-xl shadow-lg" },
            React.createElement("div", null,
                React.createElement("h2", { className: "mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white" },
                    "Restablece tu contraseña"
                ),
                React.createElement("p", { className: "mt-2 text-center text-sm text-gray-600 dark:text-gray-400" },
                    "Introduce tu correo y te enviaremos instrucciones para restablecer tu contraseña."
                )
            ),
            React.createElement("form", { className: "mt-8 space-y-6", onSubmit: handleSubmit },
                error && React.createElement("p", { className: "text-red-500 text-sm text-center" }, error),
                message && React.createElement("p", { className: "text-green-500 text-sm text-center" }, message),
                
                !message && React.createElement(React.Fragment, null,
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
                    React.createElement("div", null,
// FIX: Pass children as a prop to the Button component to satisfy the type checker.
                        React.createElement(Button, { type: "submit", isLoading: isLoading, className: "w-full", children: "Enviar Enlace" })
                    )
                )
            ),
            React.createElement("p", { className: "mt-2 text-center text-sm text-gray-600 dark:text-gray-400" },
                "¿Recuerdas tu contraseña?",
                ' ',
                React.createElement(Link, { to: "/login", className: `font-medium ${theme.textColor} ${theme.hoverTextColor}` },
                    "Inicia sesión"
                )
            )
        )
    );
};

export default ForgotPasswordPage;