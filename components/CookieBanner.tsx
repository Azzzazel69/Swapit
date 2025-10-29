import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Button from './Button.js';
import { useColorTheme } from '../hooks/useColorTheme.js';

const CookieBanner = () => {
    const [isVisible, setIsVisible] = useState(false);
    const { theme } = useColorTheme();

    useEffect(() => {
        const consent = localStorage.getItem('cookie_consent');
        if (consent === null) {
            setIsVisible(true);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('cookie_consent', 'accepted');
        setIsVisible(false);
    };
    
    const handleDecline = () => {
        localStorage.setItem('cookie_consent', 'declined');
        setIsVisible(false);
    };

    if (!isVisible) {
        return null;
    }

    return (
        React.createElement("div", { 
            className: "fixed bottom-0 left-0 right-0 bg-gray-800 text-white p-4 shadow-lg z-50 transform transition-transform duration-300 ease-out",
            style: { transform: isVisible ? 'translateY(0)' : 'translateY(100%)' }
        },
            React.createElement("div", { className: "container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4" },
                React.createElement("p", { className: "text-sm text-center sm:text-left" },
                    "Utilizamos cookies para mejorar tu experiencia. Al continuar navegando, aceptas nuestro uso de cookies. Lee nuestra",
                    ' ',
                    React.createElement(Link, { to: "/cookie-policy", className: `underline ${theme.hoverTextColor}` }, "Política de Cookies"),
                    "."
                ),
                React.createElement("div", { className: "flex-shrink-0 flex gap-2" },
                    React.createElement(Button, { size: "sm", variant: "secondary", onClick: handleDecline, children: "Rechazar" }),
                    React.createElement(Button, { size: "sm", variant: "primary", onClick: handleAccept, children: "Aceptar" })
                )
            )
        )
    );
};

export default CookieBanner;