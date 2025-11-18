
import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api.ts';
import Button from '../components/Button.tsx';
import SwapSpinner from '../components/SwapSpinner.tsx';
import { useColorTheme } from '../hooks/useColorTheme.tsx';

const VerifyEmailPage = () => {
    const { token } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { theme } = useColorTheme();

    const [status, setStatus] = useState('loading'); // 'loading', 'info', 'success', 'error'
    const [message, setMessage] = useState('');
    const [verifiedEmail, setVerifiedEmail] = useState('');
    
    const userEmail = location.state?.email;

    useEffect(() => {
        if (token) {
            setStatus('loading');
            api.verifyEmailWithToken(token)
                .then(response => {
                    setStatus('success');
                    setMessage('¡Tu correo ha sido verificado con éxito!');
                    setVerifiedEmail(response.email);
                })
                .catch(err => {
                    setStatus('error');
                    setMessage(err.message || 'Ha ocurrido un error al verificar tu correo.');
                });
        } else {
            setStatus('info');
            if (userEmail) {
                 setMessage(`Hemos enviado un enlace de verificación a ${userEmail}. Por favor, revisa tu bandeja de entrada.`);
            } else {
                 setMessage('Por favor, revisa tu bandeja de entrada para el enlace de verificación.');
            }
        }
    }, [token, userEmail]);
    
    const handleLoginRedirect = () => {
        navigate('/login', { state: { email: verifiedEmail } });
    };

    const renderContent = () => {
        switch (status) {
            case 'loading':
                return React.createElement("div", { className: "text-center" },
                    React.createElement(SwapSpinner, null),
                    React.createElement("p", { className: "mt-4" }, "Verificando tu correo...")
                );
            case 'success':
                return React.createElement("div", { className: "text-center" },
                    React.createElement("div", { className: "flex justify-center mb-4" }, 
                        React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-16 w-16 text-green-500", viewBox: "0 0 20 20", fill: "currentColor" }, React.createElement("path", { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z", clipRule: "evenodd" }))
                    ),
                    React.createElement("h3", { className: "text-xl font-semibold text-green-600" }, message),
                    React.createElement("p", { className: "mt-2 text-gray-600 dark:text-gray-400" }, "Ya puedes iniciar sesión en tu cuenta."),
                    React.createElement(Button, { onClick: handleLoginRedirect, className: "mt-6", children: "Ir a Iniciar Sesión" })
                );
            case 'error':
                 return React.createElement("div", { className: "text-center" },
                    React.createElement("div", { className: "flex justify-center mb-4" }, 
                        React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-16 w-16 text-red-500", viewBox: "0 0 20 20", fill: "currentColor" }, React.createElement("path", { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z", clipRule: "evenodd" }))
                    ),
                    React.createElement("h3", { className: "text-xl font-semibold text-red-600" }, "Error de Verificación"),
                    React.createElement("p", { className: "mt-2 text-gray-600 dark:text-gray-400" }, message),
                    React.createElement(Link, { to: "/register", className: `font-medium ${theme.textColor} ${theme.hoverTextColor} mt-6 inline-block` }, "Intenta registrarte de nuevo")
                );
            case 'info':
            default:
                return React.createElement("div", { className: "text-center" },
                    React.createElement("div", { className: "flex justify-center mb-4" }, 
                        React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-16 w-16 text-blue-500", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" }, React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" }))
                    ),
                    React.createElement("h3", { className: "text-xl font-semibold" }, "¡Casi listo! Revisa tu correo"),
                    React.createElement("p", { className: "mt-2 text-gray-600 dark:text-gray-400" }, message),
                    React.createElement("p", { className: "mt-4 text-sm text-gray-500" }, "¿No has recibido el correo? Revisa tu carpeta de spam o contacta con soporte."),
                    React.createElement(Link, { to: "/login", className: `font-medium ${theme.textColor} ${theme.hoverTextColor} mt-6 inline-block` }, "Ya lo he verificado, ir a Iniciar Sesión")
                );
        }
    };
    
    return React.createElement("div", { className: "flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" },
        React.createElement("div", { className: "max-w-md w-full space-y-8 p-10 bg-white dark:bg-gray-800 rounded-xl shadow-lg" },
            renderContent()
        )
    );
};

export default VerifyEmailPage;
