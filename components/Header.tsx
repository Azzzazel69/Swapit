import React, { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
// FIX: Changed import from useAuth.js to useAuth.tsx
import { useAuth } from '../hooks/useAuth.tsx';
import { ICONS } from '../constants.js';
import { useColorTheme } from '../hooks/useColorTheme.js';
import { api } from '../services/api.js';
import { ExchangeStatus } from '../types.js';

const Header = () => {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { theme } = useColorTheme();
  const [hasNotifications, setHasNotifications] = useState(false);

  useEffect(() => {
    const checkNotifications = async () => {
      if (!user) {
        setHasNotifications(false);
        return;
      }
      try {
        const exchanges = await api.getExchanges();
        const pendingIncoming = exchanges.some(
          ex => ex.ownerId === user.id && ex.status === ExchangeStatus.Pending
        );
        setHasNotifications(pendingIncoming);
      } catch (error) {
        console.error("Failed to check for notifications:", error);
        setHasNotifications(false);
      }
    };

    checkNotifications();
  }, [user]);

  const activeLinkClass = `bg-gray-200 dark:bg-gray-700`;
  const inactiveLinkClass = 'hover:bg-gray-200 dark:hover:bg-gray-700';

  const navLinkClasses = `px-3 py-2 rounded-md text-sm font-medium transition-colors`;

  const renderNavLinks = (isMobile = false) => (
    React.createElement(React.Fragment, null,
      React.createElement(NavLink, { to: "/", className: ({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClass : inactiveLinkClass}` }, "Inicio"),
      React.createElement(NavLink, { to: "/my-items", className: ({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClass : inactiveLinkClass}` }, "Mis Artículos"),
      React.createElement(NavLink, { to: "/profile", className: ({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClass : inactiveLinkClass}` }, "Perfil")
    )
  );

  return (
    React.createElement("header", { className: "bg-white dark:bg-gray-800 shadow-md sticky top-0 z-50" },
      React.createElement("div", { className: "container mx-auto px-4 sm:px-6 lg:px-8" },
        React.createElement("div", { className: "flex items-center justify-between h-16" },
          React.createElement("div", { className: "flex items-center" },
            React.createElement(Link, { to: "/my-items?action=add", className: `flex-shrink-0 flex items-center gap-2 text-2xl font-bold ${theme.textGradient}` },
              React.createElement("span", { className: "transform rotate-12" }, ICONS.swap),
              "Swapit",
              React.createElement("span", { className: "text-xs font-mono text-gray-400 dark:text-gray-500 ml-2 self-end mb-1" }, "v3.4")
            )
          ),
          React.createElement("div", { className: "hidden md:block" },
            React.createElement("div", { className: "ml-10 flex items-baseline space-x-4" },
              user ? React.createElement(React.Fragment, null, renderNavLinks()) : null
            )
          ),
          React.createElement("div", { className: "hidden md:block" },
            user ? (
              React.createElement("div", { className: "ml-4 flex items-center md:ml-6" },
                React.createElement("span", { className: "text-gray-600 dark:text-gray-300 mr-4" }, "Hola, ", user.name),
                React.createElement(NavLink, { 
                    to: "/exchanges", 
                    title: "Buzón",
                    className: ({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClass : inactiveLinkClass} p-2 rounded-full` 
                  },
                    React.createElement("div", { className: "relative" },
                      ICONS.envelope,
                      hasNotifications && (
                        React.createElement("span", { className: "absolute top-0 right-0 block h-2.5 w-2.5 transform translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-800" })
                      )
                    )
                  ),
                React.createElement("button", { 
                  onClick: logout, 
                  title: "Cerrar Sesión",
                  className: "p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-red-100 dark:hover:bg-red-800 hover:text-red-500 dark:hover:text-red-400 transition-colors" 
                },
                  ICONS.logout
                )
              )
            ) : (
              React.createElement("div", { className: "flex items-center gap-2" },
                React.createElement(Link, { to: "/login", className: "px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700" }, "Iniciar Sesión"),
                React.createElement(Link, { to: "/register", className: `bg-gradient-to-r ${theme.bg} ${theme.hoverBg} text-white font-bold py-2 px-4 rounded-lg transition-colors` }, "Registrarse")
              )
            )
          ),
          React.createElement("div", { className: "-mr-2 flex md:hidden" },
            React.createElement("button", { onClick: () => setIsMenuOpen(!isMenuOpen), className: "bg-gray-100 dark:bg-gray-700 inline-flex items-center justify-center p-2 rounded-md text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none" },
              React.createElement("svg", { className: "h-6 w-6", stroke: "currentColor", fill: "none", viewBox: "0 0 24 24" },
                isMenuOpen ? (
                  React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M6 18L18 6M6 6l12 12" })
                ) : (
                  React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M4 6h16M4 12h16M4 18h16" })
                )
              )
            )
          )
        )
      ),
      isMenuOpen && (
        React.createElement("div", { className: "md:hidden" },
          React.createElement("div", { className: "px-2 pt-2 pb-3 space-y-1 sm:px-3" },
            user ? (
              React.createElement(React.Fragment, null,
                renderNavLinks(true),
                React.createElement(NavLink, { 
                    to: "/exchanges", 
                    title: "Buzón",
                    className: ({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClass : inactiveLinkClass} flex items-center gap-3` 
                  },
                    React.createElement("div", { className: "relative" },
                      ICONS.envelope,
                      hasNotifications && (
                        React.createElement("span", { className: "absolute top-0 right-0 block h-2.5 w-2.5 transform translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-800" })
                      )
                    ),
                    React.createElement("span", null, "Buzón")
                  ),
                React.createElement("div", { className: "border-t border-gray-200 dark:border-gray-700 pt-4 pb-3" },
                   React.createElement("div", { className: "flex items-center px-2" },
                      React.createElement("span", { className: "text-gray-600 dark:text-gray-300 text-base font-medium" }, "Hola, ", user.name)
                   ),
                   React.createElement("div", { className: "mt-3 px-2 space-y-1" },
                      React.createElement("button", { onClick: logout, className: "w-full text-left flex items-center gap-2 rounded-md py-2 px-3 text-base font-medium text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700" },
                         ICONS.logout, " Cerrar Sesión"
                      )
                   )
                )
              )
            ) : (
              React.createElement(React.Fragment, null,
                React.createElement(Link, { to: "/login", className: "block px-3 py-2 rounded-md text-base font-medium hover:bg-gray-100 dark:hover:bg-gray-700" }, "Iniciar Sesión"),
                React.createElement(Link, { to: "/register", className: "block px-3 py-2 rounded-md text-base font-medium hover:bg-gray-100 dark:hover:bg-gray-700" }, "Registrarse")
              )
            )
          )
        )
      )
    )
  );
};

export default Header;