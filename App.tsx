
import React from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
// FIX: Changed import from useAuth.js to useAuth.tsx
import { AuthProvider, useAuth } from './hooks/useAuth.tsx';
import { ColorThemeProvider } from './hooks/useColorTheme.js';
import Header from './components/Header.js';
import HomePage from './pages/HomePage.js';
import LoginPage from './pages/LoginPage.js';
import RegisterPage from './pages/RegisterPage.js';
import MyItemsPage from './pages/MyItemsPage.js';
import ExchangesPage from './pages/ExchangesPage.js';
import ProfilePage from './pages/ProfilePage.js';
import Spinner from './components/Spinner.js';
import ItemDetailPage from './pages/ItemDetailPage.js';
import OnboardingPage from './pages/OnboardingPage.js';
import ForgotPasswordPage from './pages/ForgotPasswordPage.js';

const App = () => {
  return React.createElement(AuthProvider, null,
    React.createElement(ColorThemeProvider, null,
      React.createElement(HashRouter, null,
        React.createElement("div", { className: "min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200" },
          React.createElement(Header, null),
          React.createElement("main", { className: "flex-grow container mx-auto p-4 md:p-6" },
            React.createElement(AppRoutes, null)
          ),
          React.createElement("footer", { className: "text-center p-4 text-gray-500 text-sm" },
            "© 2024 Swapit. Todos los derechos reservados."
          )
        )
      )
    )
  );
};

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return React.createElement("div", { className: "flex justify-center items-center h-64" },
      React.createElement(Spinner, null)
    );
  }

  return React.createElement(Routes, null,
    React.createElement(Route, { path: "/login", element: !user ? React.createElement(LoginPage, null) : React.createElement(Navigate, { to: "/" }) }),
    React.createElement(Route, { path: "/register", element: !user ? React.createElement(RegisterPage, null) : React.createElement(Navigate, { to: "/" }) }),
    React.createElement(Route, { path: "/forgot-password", element: !user ? React.createElement(ForgotPasswordPage, null) : React.createElement(Navigate, { to: "/" }) }),
    React.createElement(Route, { path: "/onboarding", element: React.createElement(OnboardingGuard, null, React.createElement(OnboardingPage, null)) }),
    
    React.createElement(Route, { path: "/", element: React.createElement(ProtectedRoute, null, React.createElement(HomePage, null)) }),
    React.createElement(Route, { path: "/item/:itemId", element: React.createElement(ProtectedRoute, null, React.createElement(ItemDetailPage, null)) }),
    React.createElement(Route, { path: "/my-items", element: React.createElement(ProtectedRoute, null, React.createElement(MyItemsPage, null)) }),
    React.createElement(Route, { path: "/exchanges", element: React.createElement(ProtectedRoute, null, React.createElement(ExchangesPage, null)) }),
    React.createElement(Route, { path: "/profile", element: React.createElement(ProtectedRoute, null, React.createElement(ProfilePage, null)) }),

    React.createElement(Route, { path: "*", element: React.createElement(Navigate, { to: "/" }) })
  );
};

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return React.createElement(Navigate, { to: "/login", state: { from: location }, replace: true });
  }

  if (!user.emailVerified || !user.phoneVerified) {
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

    if (user.emailVerified && user.phoneVerified) {
        return React.createElement(Navigate, { to: "/", replace: true });
    }

    return children;
};

export default App;
