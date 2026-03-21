
import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { AuthProvider, useAuth } from './hooks/useAuth.tsx';
import { ColorThemeProvider } from './hooks/useColorTheme.tsx';
import { ConfettiProvider } from './hooks/useConfetti.tsx';
import { ToastProvider } from './hooks/useToast.tsx';
import Header from './components/Header.tsx';
import HomePage from './pages/HomePage.tsx';
import LoginPage from './pages/LoginPage.tsx';
import RegisterPage from './pages/RegisterPage.tsx';
import ExchangesPage from './pages/ExchangesPage.tsx';
import ProfilePage from './pages/ProfilePage.tsx';
import SwapSpinner from './components/SwapSpinner.tsx';
import ItemDetailPage from './pages/ItemDetailPage.tsx';
import OnboardingPage from './pages/OnboardingPage.tsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.tsx';
import TermsOfServicePage from './pages/TermsOfServicePage.tsx';
import CookiePolicyPage from './pages/CookiePolicyPage.tsx';
import { useColorTheme } from './hooks/useColorTheme.tsx';
import ChatDetailPage from './pages/ChatDetailPage.tsx';
import UserProfilePage from './pages/UserProfilePage.tsx';
import OfflineBanner from './components/OfflineBanner.tsx';
import CookieBanner from './components/CookieBanner.tsx';
import AddItemPage from './pages/AddItemPage.tsx';
import RateExchangePage from './pages/RateExchangePage.tsx';
import AdminPage from './pages/AdminPage.tsx';
import VerifyEmailPage from './pages/VerifyEmailPage.tsx';
import MeetingMapPage from './pages/MeetingMapPage.tsx';
import ExplorationModePage from './pages/ExplorationModePage.tsx';
import { initializePushNotifications } from './services/pushNotifications.ts';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';

import { seedAllData } from './services/seedData.ts';

import ErrorBoundary from './components/ErrorBoundary.tsx';

const DataSeeder = () => {
  const { user } = useAuth();
  useEffect(() => {
    console.log('DataSeeder: User state changed', { 
      email: user?.email, 
      role: user?.role, 
      uid: user?.id 
    });
    if (user?.email === 'azzazel69@gmail.com' || user?.role === 'SUPER_ADMIN') {
      console.log('DataSeeder: Admin detected, triggering seedAllData...');
      seedAllData().catch(err => {
        console.error('DataSeeder: Error during seeding', err);
      });
    }
  }, [user]);
  return null;
};

const App = () => {
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      StatusBar.setStyle({ style: Style.Dark });
      StatusBar.setBackgroundColor({ color: '#111827' }); 
      SplashScreen.hide();
    }
  }, []);

  return React.createElement(ErrorBoundary, null,
    React.createElement(AuthProvider, null,
      React.createElement(DataSeeder, null),
      React.createElement(ColorThemeProvider, null,
        React.createElement(ConfettiProvider, null,
          React.createElement(ToastProvider, null,
            React.createElement(HashRouter, null,
              React.createElement(AppContent, null)
            )
          )
        )
      )
    )
  );
};

const AppContent = () => {
    const location = useLocation();
    const { user } = useAuth();
    const { theme } = useColorTheme();
    const [isFabOpen, setIsFabOpen] = useState(false);
    
    // Determinamos si es una página de "flujo ininterrumpido" (Mapa o Chat) para quitar paddings y footer
    const isFullScreenPage = location.pathname.startsWith('/meeting-map') || location.pathname.startsWith('/chat') || location.pathname.startsWith('/exploration');
    const isAuthPage = ['/login', '/register', '/forgot-password', '/onboarding'].includes(location.pathname);

    return React.createElement("div", { 
        className: "min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200" 
    },
        !isFullScreenPage && React.createElement(OfflineBanner, null),
        !isFullScreenPage && React.createElement(Header, null),
        React.createElement("main", { 
            // pb-safe asegura que en móviles el contenido no quede detrás de la barra de navegación de gestos
            className: `${isFullScreenPage ? 'flex-grow h-[100dvh]' : 'flex-grow w-full max-w-6xl mx-auto p-4 md:p-6 flex flex-col pt-[calc(env(safe-area-inset-top,0)_+_1.5rem)] pb-32'}` 
        },
            React.createElement(AppRoutes, null)
        ),
        
        // Global Floating Action Buttons - Only on Home Page
        user && location.pathname === '/' && (
            React.createElement("div", { className: "fixed bottom-6 right-4 sm:right-6 z-50 flex flex-col items-end gap-3" },
                // Botón Añadir Artículo (+)
                React.createElement(Link, {
                    to: "/add-item",
                    title: "Añadir Artículo",
                    className: `flex items-center justify-center w-12 h-12 rounded-full shadow-xl bg-gradient-to-br ${theme.bg} text-white hover:scale-105 transition-all`
                },
                    React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-7 w-7", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: "2.5" },
                        React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M12 4v16m8-8H4" })
                    )
                ),
                // Botón Exploración (Píldora con texto para máxima claridad)
                React.createElement(Link, {
                    to: "/exploration",
                    title: "Modo Exploración",
                    className: "flex items-center justify-center h-12 px-5 gap-2 rounded-full shadow-xl bg-orange-500 text-white hover:scale-105 transition-all font-bold"
                },
                    React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: "2" },
                        React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" })
                    ),
                    "Explorar"
                )
            )
        ),

        !isFullScreenPage && React.createElement(AppFooter, null),
        !isFullScreenPage && React.createElement(CookieBanner, null)
    );
};

const AppFooter = () => {
  const { theme } = useColorTheme();

  return (
    React.createElement("footer", { className: "text-center p-6 text-gray-500 text-sm border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 pb-[calc(env(safe-area-inset-bottom,0)_+_1.5rem)]" },
      `© 2025 Swapit. Todos los derechos reservados.`,
      React.createElement("div", { className: "mt-3 flex flex-wrap justify-center gap-2" },
        React.createElement(Link, { to: "/terms-of-service", className: `font-bold ${theme.textColor} ${theme.hoverTextColor}` }, "Términos"),
        "•",
        React.createElement(Link, { to: "/cookie-policy", className: `font-bold ${theme.textColor} ${theme.hoverTextColor}` }, "Cookies"),
        "•",
        React.createElement(Link, { to: "/terms-of-service#privacy", className: `font-bold ${theme.textColor} ${theme.hoverTextColor}` }, "Privacidad")
      )
    )
  );
};

const AppRoutes = () => {
  const { user, loading } = useAuth();

  React.useEffect(() => {
    if (user) {
        initializePushNotifications();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-6 text-center">
        <div className="relative mb-8">
            <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full animate-pulse"></div>
            <SwapSpinner size="lg" />
        </div>
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-4"
        >
            <h1 className="text-2xl font-black text-white tracking-tight">Swapit</h1>
            <p className="text-gray-400 text-sm max-w-xs mx-auto animate-pulse">
                Preparando tu experiencia de intercambio...
            </p>
        </motion.div>
      </div>
    );
  }

  return React.createElement(Routes, null,
    React.createElement(Route, { path: "/login", element: !user ? React.createElement(LoginPage, null) : React.createElement(Navigate, { to: "/" }) }),
    React.createElement(Route, { path: "/register", element: !user ? React.createElement(RegisterPage, null) : React.createElement(Navigate, { to: "/" }) }),
    React.createElement(Route, { path: "/forgot-password", element: !user ? React.createElement(ForgotPasswordPage, null) : React.createElement(Navigate, { to: "/" }) }),
    React.createElement(Route, { path: "/verify-email", element: React.createElement(VerifyEmailPage, null) }),
    React.createElement(Route, { path: "/verify-email/:token", element: React.createElement(VerifyEmailPage, null) }),
    React.createElement(Route, { path: "/onboarding", element: React.createElement(OnboardingGuard, null, React.createElement(OnboardingPage, null)) }),
    
    React.createElement(Route, { path: "/terms-of-service", element: React.createElement(TermsOfServicePage, null) }),
    React.createElement(Route, { path: "/cookie-policy", element: React.createElement(CookiePolicyPage, null) }),

    React.createElement(Route, { path: "/", element: React.createElement(ProtectedRoute, null, React.createElement(HomePage, null)) }),
    React.createElement(Route, { path: "/add-item", element: React.createElement(ProtectedRoute, null, React.createElement(AddItemPage, null)) }),
    React.createElement(Route, { path: "/item/:itemId", element: React.createElement(ProtectedRoute, null, React.createElement(ItemDetailPage, null)) }),
    React.createElement(Route, { path: "/exploration", element: React.createElement(ProtectedRoute, null, React.createElement(ExplorationModePage, null)) }),
    React.createElement(Route, { path: "/exchanges", element: React.createElement(ProtectedRoute, null, React.createElement(ExchangesPage, null)) }),
    React.createElement(Route, { path: "/chat/:exchangeId", element: React.createElement(ProtectedRoute, null, React.createElement(ChatDetailPage, null)) }),
    React.createElement(Route, { path: "/meeting-map/:exchangeId", element: React.createElement(ProtectedRoute, null, React.createElement(MeetingMapPage, null)) }),
    React.createElement(Route, { path: "/rate-exchange/:exchangeId", element: React.createElement(ProtectedRoute, null, React.createElement(RateExchangePage, null)) }),
    React.createElement(Route, { path: "/profile", element: React.createElement(ProtectedRoute, null, React.createElement(ProfilePage, null)) }),
    React.createElement(Route, { path: "/user/:userId", element: React.createElement(ProtectedRoute, null, React.createElement(UserProfilePage, null)) }),
    
    React.createElement(Route, { path: "/admin", element: React.createElement(AdminRoute, null, React.createElement(AdminPage, null)) }),

    React.createElement(Route, { path: "*", element: React.createElement(Navigate, { to: "/" }) })
  );
};

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return React.createElement(Navigate, { to: "/login", state: { from: location }, replace: true });
  }

  const isFullyOnboarded = user.emailVerified && user.location && user.preferences?.length > 0;

  if (!isFullyOnboarded) {
    console.log("ProtectedRoute: User not fully onboarded", {
        verified: user.emailVerified,
        location: !!user.location,
        prefs: user.preferences?.length
    });
    return React.createElement(Navigate, { to: "/onboarding", state: { from: location }, replace: true });
  }

  return children;
};

const AdminRoute = ({ children }) => {
  const { user } = useAuth();
  const isStaff = user?.role === 'SUPER_ADMIN' || user?.role === 'MODERATOR' || user?.email === 'azzazel69@gmail.com';
  if (!user || !isStaff) {
    return React.createElement(Navigate, { to: "/", replace: true });
  }
  return children;
};

const OnboardingGuard = ({ children }) => {
    const { user } = useAuth();
    const location = useLocation();

    if (!user) {
        return React.createElement(Navigate, { to: "/login", state: { from: location }, replace: true });
    }

    const isFullyOnboarded = user.emailVerified && user.location && user.preferences?.length > 0;

    if (isFullyOnboarded) {
        console.log("OnboardingGuard: User already fully onboarded, redirecting to home");
        return React.createElement(Navigate, { replace: true, to: "/" });
    }

    return children;
};

export default App;
