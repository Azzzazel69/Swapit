
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MyItemsPage from './pages/MyItemsPage';
import ExchangesPage from './pages/ExchangesPage';
import ProfilePage from './pages/ProfilePage';
import Spinner from './components/Spinner';
import ItemDetailPage from './pages/ItemDetailPage';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
          <Header />
          <main className="flex-grow container mx-auto p-4 md:p-6">
            <AppRoutes />
          </main>
          <footer className="text-center p-4 text-gray-500 text-sm">
            © 2024 Swapit. All rights reserved.
          </footer>
        </div>
      </HashRouter>
    </AuthProvider>
  );
};

const AppRoutes: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" />} />
      <Route path="/register" element={!user ? <RegisterPage /> : <Navigate to="/" />} />
      
      <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
      <Route path="/item/:itemId" element={<ProtectedRoute><ItemDetailPage /></ProtectedRoute>} />
      <Route path="/my-items" element={<ProtectedRoute><MyItemsPage /></ProtectedRoute>} />
      <Route path="/exchanges" element={<ProtectedRoute><ExchangesPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

interface ProtectedRouteProps {
  children: React.ReactElement;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" />;
  }
  return children;
};


export default App;
