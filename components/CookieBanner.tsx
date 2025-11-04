import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useColorTheme } from '../hooks/useColorTheme.tsx';
import Button from './Button.tsx';
import { useAuth } from '../hooks/useAuth.tsx';

const CookieBanner = () => {
    const [isVisible, setIsVisible] = useState(false);
    const { theme } = useColorTheme();
    const location = useLocation();
    const { user } = useAuth(); // Importar el estado de autenticación

    useEffect(() => {
        // Check localStorage after a short delay to ensure client-side execution
        const timer = setTimeout(() => {
            if (typeof window !== 'undefined' && window.localStorage) {
                const consent = window.localStorage.getItem('cookie_consent');
                if (consent !== 'accepted') {
                    setIsVisible(true);
                }
            }
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    const handleAccept = () => {
        if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem('cookie_consent', 'accepted');
        }
        setIsVisible(false);
    };

    const authPaths = ['/login', '/register', '/forgot-password', '/onboarding'];
    const shouldHideOnAuthPage = authPaths.includes(location.pathname);

    // Si el usuario ha iniciado sesión, NUNCA mostrar el banner
    if (!isVisible || shouldHideOnAuthPage || user) {
        return null;
    }

    return (
        React.createElement("div", {
            className: "fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 shadow-lg z-50 transition-transform duration-300 transform translate-y-0",
            role: "dialog",
            "aria-live": "polite",
            "aria-label": "Banner de cookies"
        },
            React.createElement("div", { className: "container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4" },
                React.createElement("p", { className: "text-sm text-gray-700 dark:text-gray-300 flex-grow" },
                    "Utilizamos cookies para mejorar tu experiencia. Al continuar navegando, aceptas nuestro uso de cookies. Lee nuestra ",
                    React.createElement(Link, {
                        to: "/cookie-policy",
                        className: `font-medium ${theme.textColor} ${theme.hoverTextColor} underline`
                    }, "Política de Cookies"),
                    " para más información."
                ),
                React.createElement("div", { className: "flex-shrink-0" },
                    React.createElement(Button, { onClick: handleAccept, size: "sm", children: "Entendido" })
                )
            )
        )
    );
};

export default CookieBanner;