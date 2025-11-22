
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
  const APP_VERSION = "1.1 (Test Mode)";

  const activeLinkClass = `bg-gray-200 dark:bg-gray-700`;
  const inactiveLinkClass = 'hover:bg-gray-200 dark:hover:bg-gray-700';
  const navLinkClasses = `px-3 py-2 rounded-md text-sm font-medium transition-colors`;
  
  const showAuthButtons = !['/login', '/register', '/forgot-password'].includes(location.pathname);

  const ICONS_ADMIN = {
    shield: React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2 }, React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 20.944A12.02 12.02 0 0012 22a12.02 12.02 0 009-1.056 11.955 11.955 0 01-5.382-3.042z" }))
  };

  return (
    React.createElement("header", { className: "bg-white dark:bg-gray-800 shadow-md sticky top-0 z-50" },
      React.createElement("div", { className: "container mx-auto px-4 sm:px-6 lg:px-8" },
        React.createElement("div", { className: "flex items-center justify-between h-16" },
          
          // Left side: User Profile link (Desktop only, moves to bottom nav on mobile)
          React.createElement("div", { className: "flex-1 flex items-center justify-start" },
            user && (
              React.createElement("div", { className: "hidden md:flex items-center gap-2" },
                React.createElement(NavLink, { 
                  to: "/profile", 
                  className: ({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClass : inactiveLinkClass} flex items-center gap-2` 
                }, 
                  React.createElement("img", { src: user.avatarUrl, alt: "Avatar", className: "h-8 w-8 rounded-full object-cover" }),
                  React.createElement("span", { className: "hidden sm:inline-block" }, user.name)
                ),
                user.role === 'SUPER_ADMIN' && (
                  React.createElement(Link, {
                    to: "/admin",
                    title: "Panel de Administración",
                    className: "p-3 rounded-full text-gray-500 dark:text-gray-400 hover:bg-yellow-100 dark:hover:bg-yellow-800 hover:text-yellow-500 dark:hover:text-yellow-400 transition-colors"
                  },
                    ICONS_ADMIN.shield
                  )
                )
              )
            )
          ),

          // Center: Logo (Dual Mask Implementation)
          React.createElement("div", { className: "flex-shrink-0 px-4 flex items-center gap-1" },
            React.createElement(Link, { 
              to: "/", 
              className: "block transition-transform hover:scale-105 relative",
              title: "Página de inicio"
            },
               /* 
                 LOGIC: Dual Layer Logo 
                 1. Layer 'Dynamic': The border and "IT" text. Takes the theme gradient.
                 2. Layer 'Static': The "SWAP" text. Takes a solid color (white in dark mode, dark gray in light mode).
                 
                 Requires two files in /public:
                 - logo_dynamic.png (The border + IT shape)
                 - logo_static.png (The SWAP text shape)
              */
              React.createElement("div", { className: "relative h-10 w-32" },
                  // Layer 1: Dynamic Gradient (Border + IT)
                  React.createElement("div", {
                    className: `absolute inset-0 bg-gradient-to-r ${theme.bg}`,
                    style: {
                        maskImage: 'url(/logo_dynamic.png)',
                        WebkitMaskImage: 'url(/logo_dynamic.png)',
                        maskSize: 'contain',
                        WebkitMaskSize: 'contain',
                        maskRepeat: 'no-repeat',
                        WebkitMaskRepeat: 'no-repeat',
                        maskPosition: 'center',
                        WebkitMaskPosition: 'center'
                    }
                  }),
                  // Layer 2: Static Color (SWAP) - Dark text in light mode, White text in dark mode
                  React.createElement("div", {
                    className: `absolute inset-0 bg-gray-800 dark:bg-white`,
                    style: {
                        maskImage: 'url(/logo_static.png)',
                        WebkitMaskImage: 'url(/logo_static.png)',
                        maskSize: 'contain',
                        WebkitMaskSize: 'contain',
                        maskRepeat: 'no-repeat',
                        WebkitMaskRepeat: 'no-repeat',
                        maskPosition: 'center',
                        WebkitMaskPosition: 'center'
                    }
                  })
              )
            ),
            React.createElement("div", { className: "flex flex-col items-start self-end mb-2" },
              React.createElement("span", { className: "text-[10px] font-bold text-gray-400 dark:text-gray-500 leading-none" }, `${APP_VERSION}`)
            )
          ),

          // Right side: Icons or Auth buttons
          React.createElement("div", { className: "flex-1 flex items-center justify-end gap-2 sm:gap-4" },
            user ? (
              React.createElement(React.Fragment, null,
                // Desktop: Show Inbox
                React.createElement(Link, { 
                    to: "/exchanges", 
                    title: "Buzón",
                    className: "hidden md:flex relative p-3 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" 
                  },
                    ICONS.envelope,
                    React.createElement(NotificationBadge, null)
                  ),
                // Mobile: Admin icon if applicable (since profile moves to bottom, admin needs a place or stay in hamburger menu, keeping here for now)
                user.role === 'SUPER_ADMIN' && (
                     React.createElement(Link, {
                        to: "/admin",
                        className: "md:hidden p-2 text-yellow-500"
                     }, ICONS_ADMIN.shield)
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
