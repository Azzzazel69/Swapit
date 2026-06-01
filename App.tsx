
import React, { useEffect, useState, lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, Link, useSearchParams } from 'react-router-dom';
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
import OnboardingPage from './pages/OnboardingPage.tsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.tsx';
import TermsOfServicePage from './pages/TermsOfServicePage.tsx';
import CookiePolicyPage from './pages/CookiePolicyPage.tsx';
import { useColorTheme } from './hooks/useColorTheme.tsx';
import OfflineBanner from './components/OfflineBanner.tsx';
import CookieBanner from './components/CookieBanner.tsx';
import BottomNav from './components/BottomNav.tsx';
import VerifyEmailPage from './pages/VerifyEmailPage.tsx';
import { initializePushNotifications } from './services/pushNotifications.ts';
import { api } from './services/api.ts';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';

const AdminPage = lazy(() => import('./pages/AdminPage.tsx'));
const ChatDetailPage = lazy(() => import('./pages/ChatDetailPage.tsx'));
const MeetingMapPage = lazy(() => import('./pages/MeetingMapPage.tsx'));
const ExplorationModePage = lazy(() => import('./pages/ExplorationModePage.tsx'));
const ItemDetailPage = lazy(() => import('./pages/ItemDetailPage.tsx'));
const AddItemPage = lazy(() => import('./pages/AddItemPage.tsx'));
const RateExchangePage = lazy(() => import('./pages/RateExchangePage.tsx'));
const UserProfilePage = lazy(() => import('./pages/UserProfilePage.tsx'));

import ErrorBoundary from './components/ErrorBoundary.tsx';

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
    // Fab open state removed
    
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
        
        // Bottom Navigation Bar
        user && !isFullScreenPage && React.createElement(BottomNav, null),

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
  const [searchParams] = useSearchParams();
  const location = useLocation();

  React.useEffect(() => {
    if (user) {
        initializePushNotifications();
        
        // Heartbeat for presence
        const interval = setInterval(() => {
            api.updateLastSeen();
        }, 30000); // Every 30 seconds
        api.updateLastSeen(); // Initial update
        
        return () => clearInterval(interval);
    }
  }, [user]);

  // Intercept Firebase Email verification/Password reset codes
  const mode = searchParams.get('mode');
  const oobCode = searchParams.get('oobCode');
  
  if (oobCode && mode === 'verifyEmail' && location.pathname !== '/verify-email') {
     return React.createElement(Navigate, { to: `/verify-email?oobCode=${oobCode}`, replace: true });
  }

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

  return React.createElement(Suspense, { fallback: React.createElement(SwapSpinner, null) },
    React.createElement(Routes, null,
      React.createElement(Route, { path: "/login", element: !user ? React.createElement(LoginPage, null) : React.createElement(Navigate, { to: "/" }) }),
      React.createElement(Route, { path: "/register", element: !user ? React.createElement(RegisterPage, null) : React.createElement(Navigate, { to: "/" }) }),
      React.createElement(Route, { path: "/forgot-password", element: !user ? React.createElement(ForgotPasswordPage, null) : React.createElement(Navigate, { to: "/" }) }),
      React.createElement(Route, { path: "/verify-email", element: React.createElement(VerifyEmailPage, null) }),
      React.createElement(Route, { path: "/verify-email/:token", element: React.createElement(VerifyEmailPage, null) }),
      React.createElement(Route, { path: "/onboarding", element: React.createElement(OnboardingGuard, null, React.createElement(OnboardingPage, null)) }),
      
      React.createElement(Route, { path: "/terms-of-service", element: React.createElement(TermsOfServicePage, null) }),
      React.createElement(Route, { path: "/cookie-policy", element: React.createElement(CookiePolicyPage, null) }),

      React.createElement(Route, { path: "/", element: React.createElement(ProtectedRoute, null, React.createElement(ErrorBoundary, null, React.createElement(HomePage, null))) }),
      React.createElement(Route, { path: "/add-item", element: React.createElement(ProtectedRoute, null, React.createElement(ErrorBoundary, null, React.createElement(AddItemPage, null))) }),
      React.createElement(Route, { path: "/item/:itemId", element: React.createElement(ProtectedRoute, null, React.createElement(ErrorBoundary, null, React.createElement(ItemDetailPage, null))) }),
      React.createElement(Route, { path: "/exploration", element: React.createElement(ProtectedRoute, null, React.createElement(ErrorBoundary, null, React.createElement(ExplorationModePage, null))) }),
      React.createElement(Route, { path: "/exchanges", element: React.createElement(ProtectedRoute, null, React.createElement(ErrorBoundary, null, React.createElement(ExchangesPage, null))) }),
      React.createElement(Route, { path: "/chat/:exchangeId", element: React.createElement(ProtectedRoute, null, React.createElement(ErrorBoundary, null, React.createElement(ChatDetailPage, null))) }),
      React.createElement(Route, { path: "/meeting-map/:exchangeId", element: React.createElement(ProtectedRoute, null, React.createElement(ErrorBoundary, null, React.createElement(MeetingMapPage, null))) }),
      React.createElement(Route, { path: "/rate-exchange/:exchangeId", element: React.createElement(ProtectedRoute, null, React.createElement(ErrorBoundary, null, React.createElement(RateExchangePage, null))) }),
      React.createElement(Route, { path: "/profile", element: React.createElement(ProtectedRoute, null, React.createElement(ErrorBoundary, null, React.createElement(ProfilePage, null))) }),
      React.createElement(Route, { path: "/user/:userId", element: React.createElement(ProtectedRoute, null, React.createElement(ErrorBoundary, null, React.createElement(UserProfilePage, null))) }),
      
      React.createElement(Route, { path: "/admin", element: React.createElement(AdminRoute, null, React.createElement(ErrorBoundary, null, React.createElement(AdminPage, null))) }),

      React.createElement(Route, { path: "*", element: React.createElement(Navigate, { to: "/" }) })
    )
  );
};

export const isUserFullyOnboarded = (user) => {
  if (!user) return false;
  const isTestUser = user.email?.endsWith('@test.com') || user.role === 'SUPER_ADMIN' || user.role === 'MODERATOR' || user.role === 'ADMIN';
  return isTestUser || !!(user.emailVerified && user.phoneVerified && user.location?.city && user.location?.province && user.preferences?.length > 0);
};

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return React.createElement(Navigate, { to: "/login", state: { from: location }, replace: true });
  }

  const fullyOnboarded = isUserFullyOnboarded(user);

  if (!fullyOnboarded) {
    const missingSteps = [];
    if (!user.emailVerified) missingSteps.push("Email no verificado");
    if (!user.phoneVerified) missingSteps.push("Teléfono no verificado");
    if (!user.location || !user.location.city) missingSteps.push("Ubicación no configurada");
    if (!user.preferences || user.preferences.length === 0) missingSteps.push("Preferencias no seleccionadas");
    
    if (import.meta.env.DEV) console.log("ProtectedRoute: Redirigiendo a onboarding. Pasos pendientes:", missingSteps);
    
    return React.createElement(Navigate, { to: "/onboarding", state: { from: location }, replace: true });
  }

  return children;
};

const AdminRoute = ({ children }) => {
  const { user } = useAuth();
  const isStaff = user?.role === 'SUPER_ADMIN' || user?.role === 'MODERATOR' || user?.role === 'ADMIN';
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

    const fullyOnboarded = isUserFullyOnboarded(user);

    if (fullyOnboarded) {
        if (import.meta.env.DEV) console.log("OnboardingGuard: User already fully onboarded, redirecting to home");
        return React.createElement(Navigate, { replace: true, to: "/" });
    }

    return children;
};

export default App;
