
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

  const ICONS_ADMIN = {
    shield: React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2 }, React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 20.944A12.02 12.02 0 0012 22a12.02 12.02 0 009-1.056 11.955 11.955 0 01-5.382-3.042z" }))
  };

  const isStaff = user?.role === 'SUPER_ADMIN' || user?.role === 'MODERATOR';

  return (
    React.createElement("header", { className: "bg-white dark:bg-gray-800 shadow-md sticky top-0 z-50 border-b border-gray-100 dark:border-gray-700" },
      React.createElement("div", { className: "container mx-auto px-4 sm:px-6 lg:px-8" },
        React.createElement("div", { className: "flex items-center justify-between h-16" },
          
          // Lado izquierdo: Perfil
          React.createElement("div", { className: "flex-1 flex items-center justify-start min-w-0 mr-2" },
            user && (
              React.createElement("div", { className: "flex items-center gap-1 sm:gap-2 min-w-0" },
                React.createElement(NavLink, { 
                  to: "/profile", 
                  className: ({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClass : inactiveLinkClass} flex items-center gap-2 !p-1 sm:!p-2 min-w-0` 
                }, 
                  React.createElement("img", { src: user.avatarUrl, alt: "Avatar", className: "h-8 w-8 sm:h-9 sm:w-9 rounded-full object-cover border-2 border-gray-100 dark:border-gray-600 shadow-sm flex-shrink-0" }),
                  React.createElement("span", { className: "inline-block font-bold text-gray-700 dark:text-gray-200 text-xs sm:text-sm truncate max-w-[80px] xs:max-w-[120px] sm:max-w-[150px] lg:max-w-[200px]" }, user.name)
                ),
                isStaff && (
                  React.createElement(Link, {
                    to: "/admin",
                    title: "Centro de Control Staff",
                    className: "hidden md:flex p-2.5 rounded-full text-gray-500 dark:text-gray-400 hover:bg-yellow-100 dark:hover:bg-yellow-800 hover:text-yellow-500 dark:hover:text-yellow-400 transition-colors"
                  },
                    ICONS_ADMIN.shield
                  )
                )
              )
            )
          ),

          // Centro: Logo Original (Restaurado)
          React.createElement("div", { className: "flex-shrink-0 flex items-center mx-1 sm:mx-4" },
            React.createElement(Link, { 
              to: "/", 
              className: "flex items-center group",
              title: "Volver al Inicio"
            },
               React.createElement("div", { className: `bg-gradient-to-r ${theme.bg} px-3 py-1.5 rounded-xl flex items-center shadow-lg group-hover:shadow-xl transition-all transform group-hover:scale-[1.03] border-b-4 border-black/20` },
                    React.createElement("span", { className: "text-white font-black text-xl sm:text-3xl tracking-tighter leading-none" }, "SWAP"),
                    React.createElement("span", { className: `${theme.logoAccent} font-black text-xl sm:text-3xl tracking-tighter shadow-sm leading-none ml-0.5` }, "IT")
               )
            )
          ),

          // Lado derecho: Iconos
          React.createElement("div", { className: "flex-1 flex items-center justify-end gap-1 sm:gap-3" },
            user ? (
              React.createElement(React.Fragment, null,
                React.createElement(Link, { 
                    to: "/exchanges", 
                    title: "Buzón de Mensajes",
                    className: "relative p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" 
                  },
                    ICONS.envelope,
                    React.createElement(NotificationBadge, null)
                  ),
                isStaff && (
                     React.createElement(Link, {
                        to: "/admin",
                        className: "md:hidden p-2 text-yellow-500"
                     }, ICONS_ADMIN.shield)
                ),
                React.createElement("button", { 
                  onClick: logout, 
                  title: "Cerrar Sesión",
                  className: "p-2.5 rounded-full text-gray-400 dark:text-gray-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-colors" 
                },
                  ICONS.logout
                )
              )
            ) : (
              showAuthButtons && (
                React.createElement("div", { className: "flex items-center gap-2" },
                  React.createElement(Link, { to: "/login", className: "px-3 py-2 rounded-md text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700" }, "Entrar"),
                  React.createElement(Link, { to: "/register", className: `bg-gradient-to-r ${theme.bg} hover:opacity-90 text-white font-bold py-2 px-4 rounded-lg transition-colors shadow-sm` }, "Registro")
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
