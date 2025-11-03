
import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth.tsx';
import { ColorThemeProvider } from './hooks/useColorTheme.tsx';
import { ConfettiProvider } from './hooks/useConfetti.tsx';
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
import { initializePushNotifications, requestNotificationPermission } from './services/pushNotifications.ts';
import CookieBanner from './components/CookieBanner.tsx';
import AddItemPage from './pages/AddItemPage.tsx';

const App = () => {
  return React.createElement(AuthProvider, null,
    React.createElement(ColorThemeProvider, null,
      React.createElement(ConfettiProvider, null,
        React.createElement(HashRouter, null,
          React.createElement("div", { className: "min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200" },
            React.createElement(OfflineBanner, null),
            React.createElement(Header, null),
            React.createElement("main", { className: "flex-grow container mx-auto p-4 md:p-6 flex flex-col pt-[calc(env(safe-area-inset-top,0)_+_1rem)]" },
              React.createElement(AppRoutes, null)
            ),
            React.createElement(AppFooter, null),
            React.createElement(CookieBanner, null)
          )
        )
      )
    )
  );
};

const AppFooter = () => {
  const { theme } = useColorTheme();

  return (
    React.createElement("footer", { className: "text-center p-4 text-gray-500 text-sm border-t border-gray-200 dark:border-gray-700" },
      "© 2025 Swapit. Todos los derechos reservados.",
      React.createElement("div", { className: "mt-2" },
        React.createElement(Link, { to: "/terms-of-service", className: `font-medium ${theme.textColor} ${theme.hoverTextColor} mx-2` }, "Términos de Servicio"),
        "|",
        React.createElement(Link, { to: "/cookie-policy", className: `font-medium ${theme.textColor} ${theme.hoverTextColor} mx-2` }, "Política de Cookies")
      )
    )
  );
};

const AppRoutes = () => {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (user) {
      // Initialize push notifications once the user is logged in
      initializePushNotifications();
      // After initialization, request permission
      requestNotificationPermission();
    }
  }, [user]);

  if (loading) {
    return React.createElement("div", { className: "flex justify-center items-center h-64" },
      React.createElement(SwapSpinner, null)
    );
  }

  return React.createElement(Routes, null,
    React.createElement(Route, { path: "/login", element: !user ? React.createElement(LoginPage, null) : React.createElement(Navigate, { to: "/" }) }),
    React.createElement(Route, { path: "/register", element: !user ? React.createElement(RegisterPage, null) : React.createElement(Navigate, { to: "/" }) }),
    React.createElement(Route, { path: "/forgot-password", element: !user ? React.createElement(ForgotPasswordPage, null) : React.createElement(Navigate, { to: "/" }) }),
    React.createElement(Route, { path: "/onboarding", element: React.createElement(OnboardingGuard, null, React.createElement(OnboardingPage, null)) }),
    
    React.createElement(Route, { path: "/terms-of-service", element: React.createElement(TermsOfServicePage, null) }),
    React.createElement(Route, { path: "/cookie-policy", element: React.createElement(CookiePolicyPage, null) }),

    React.createElement(Route, { path: "/", element: React.createElement(ProtectedRoute, null, React.createElement(HomePage, null)) }),
    React.createElement(Route, { path: "/add-item", element: React.createElement(ProtectedRoute, null, React.createElement(AddItemPage, null)) }),
    React.createElement(Route, { path: "/item/:itemId", element: React.createElement(ProtectedRoute, null, React.createElement(ItemDetailPage, null)) }),
    React.createElement(Route, { path: "/exchanges", element: React.createElement(ProtectedRoute, null, React.createElement(ExchangesPage, null)) }),
    React.createElement(Route, { path: "/chat/:exchangeId", element: React.createElement(ProtectedRoute, null, React.createElement(ChatDetailPage, null)) }),
    React.createElement(Route, { path: "/profile", element: React.createElement(ProtectedRoute, null, React.createElement(ProfilePage, null)) }),
    React.createElement(Route, { path: "/user/:userId", element: React.createElement(ProtectedRoute, null, React.createElement(UserProfilePage, null)) }),

    React.createElement(Route, { path: "*", element: React.createElement(Navigate, { to: "/" }) })
  );
};

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return React.createElement(Navigate, { to: "/login", state: { from: location }, replace: true });
  }

  const isFullyOnboarded = user.emailVerified && user.phoneVerified && user.location && user.preferences?.length > 0;

  if (!isFullyOnboarded) {
    return React.createElement(Navigate, { to: "/onboarding", state: { from: location }, replace: true });
  }

  return children;
};

const OnboardingGuard = ({ children }) => {
    const { user } = useAuth();
    const location = useLocation();

    if (!user) {
        return React.createElement(Navigate, { to: "/login", state: { from: location }, replace: true });
    }

    const isFullyOnboarded = user.emailVerified && user.phoneVerified && user.location && user.preferences?.length > 0;

    if (isFullyOnboarded) {
        return React.createElement(Navigate, { to: "/", replace: true });
    }

    return children;
};

export default App;