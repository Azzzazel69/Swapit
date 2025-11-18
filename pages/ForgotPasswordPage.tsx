
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Input from '../components/Input.tsx';
import Button from '../components/Button.tsx';
import { api } from '../services/api.ts';
import { useColorTheme } from '../hooks/useColorTheme.tsx';

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
            setError(err.message || 'Ocurrió un error. Por favor, inténtalo de nuevo.');
        } finally {
            setIsLoading(false);
        }
    };

    return React.createElement("div", { className: "flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" },
        React.createElement("div", { className: "max-w-md w-full space-y-8 p-10 bg-white dark:bg-gray-800 rounded-xl shadow-lg" },
            React.createElement("div", null,
                React.createElement("h2", { className: "mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white" },
                    "Restablecer Contraseña"
                ),
                React.createElement("p", { className: "mt-2 text-center text-sm text-gray-600 dark:text-gray-400" },
                    "Introduce tu correo y te enviaremos instrucciones."
                )
            ),
            React.createElement("form", { className: "mt-8 space-y-6", onSubmit: handleSubmit },
                error && React.createElement("p", { className: "text-red-500 text-sm text-center p-2 bg-red-100 dark:bg-red-900/50 rounded-md" }, error),
                message && React.createElement("p", { className: "text-green-600 text-sm text-center p-2 bg-green-100 dark:bg-green-900/50 rounded-md" }, message),
                React.createElement("div", { className: "rounded-md shadow-sm" },
                    React.createElement(Input, {
                        id: "email-address",
                        label: "Correo electrónico",
                        name: "email",
                        type: "email",
                        autoComplete: "email",
                        required: true,
                        value: email,
                        onChange: (e) => setEmail(e.target.value)
                    })
                ),
                React.createElement("div", null,
                    React.createElement(Button, { type: "submit", isLoading: isLoading, className: "w-full", children: "Enviar Enlace de Reseteo" })
                ),
                React.createElement("div", { className: "text-sm text-center mt-4" },
                    React.createElement(Link, { to: "/login", className: `font-medium ${theme.textColor} ${theme.hoverTextColor}` },
                        "Volver a Iniciar Sesión"
                    )
                )
            )
        )
    );
};

export default ForgotPasswordPage;
