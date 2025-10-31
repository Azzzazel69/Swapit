import React from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.tsx';
import { ICONS } from '../constants.tsx';
import { useColorTheme } from '../hooks/useColorTheme.tsx';
import NotificationBadge from './NotificationBadge.tsx';

const Header = () => {
  const { user, logout } = useAuth();
  const { theme } = useColorTheme();
  const location = useLocation();

  const activeLinkClass = `bg-gray-200 dark:bg-gray-700`;
  const inactiveLinkClass = 'hover:bg-gray-200 dark:hover:bg-gray-700';
  const navLinkClasses = `px-3 py-2 rounded-md text-sm font-medium transition-colors`;
  
  const showAuthButtons = !['/login', '/register', '/forgot-password'].includes(location.pathname);

  return (
    React.createElement("header", { className: "bg-white dark:bg-gray-800 shadow-md sticky top-0 z-50" },
      React.createElement("div", { className: "container mx-auto px-4 sm:px-6 lg:px-8" },
        React.createElement("div", { className: "flex items-center justify-between h-16" },
          
          // Left side: User Profile link
          React.createElement("div", { className: "flex-1 flex items-center justify-start" },
            user && (
              React.createElement(NavLink, { to: "/profile", className: ({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClass : inactiveLinkClass}` }, user.name)
            )
          ),

          // Center: Logo
          React.createElement("div", { className: "flex-shrink-0 px-4 flex items-center gap-2" },
            React.createElement(Link, { 
              to: "/", 
              className: `flex items-center gap-2 text-3xl font-bold ${theme.textGradient} transition-transform hover:scale-105`,
              title: "Página de inicio"
            },
              React.createElement("span", { className: "transform rotate-12" }, ICONS.swap),
              "Swapit"
            ),
            React.createElement("span", { className: "text-sm italic text-gray-400 self-end mb-1" }, "(beta)")
          ),

          // Right side: Icons or Auth buttons
          React.createElement("div", { className: "flex-1 flex items-center justify-end gap-2 sm:gap-4" },
            user ? (
              React.createElement(React.Fragment, null,
                React.createElement(Link, { 
                    to: "/exchanges", 
                    title: "Buzón",
                    className: "relative p-3 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" 
                  },
                    ICONS.envelope,
                    React.createElement(NotificationBadge, null)
                  ),
                React.createElement("button", { 
                  onClick: logout, 
                  title: "Cerrar Sesión",
                  className: "p-3 rounded-full text-gray-500 dark:text-gray-400 hover:bg-red-100 dark:hover:bg-red-800 hover:text-red-500 dark:hover:text-red-400 transition-colors" 
                },
                  ICONS.logout
                )
              )
            ) : (
              showAuthButtons && (
                React.createElement("div", { className: "flex items-center gap-2" },
                  React.createElement(Link, { to: "/login", className: "px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700" }, "Iniciar Sesión"),
                  React.createElement(Link, { to: "/register", className: `bg-gradient-to-r ${theme.bg} ${theme.hoverBg} text-white font-bold py-2 px-4 rounded-lg transition-colors` }, "Registrarse")
                )
              )
            )
          )
        )
      )
    )
  );
};

export default Header;