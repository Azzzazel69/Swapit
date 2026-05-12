import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.tsx';
import { useColorTheme } from '../hooks/useColorTheme.tsx';

const Header = () => {
  const { user } = useAuth();
  const { theme } = useColorTheme();
  const location = useLocation();

  const isAuthPage = ['/login', '/register', '/forgot-password'].includes(location.pathname);

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-50 border-b border-gray-100 dark:border-gray-700">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-14 relative">
          
          <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center">
            <Link 
              to="/" 
              className="flex items-center text-2xl tracking-tighter"
              title="Volver al Inicio"
            >
                <span className={`bg-clip-text text-transparent bg-gradient-to-r ${theme.bg} font-black`}>Swap</span>
                <span className={`${theme.textColor} font-black`}>It</span>
            </Link>
          </div>

          <div className="ml-auto flex items-center justify-end text-sm text-gray-600 dark:text-gray-300 gap-2 font-medium">
             {!isAuthPage && user?.location?.city ? (
                 <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{user.location.city}</span>
                 </>
             ) : null}
             {!isAuthPage && user && (user.role === 'SUPER_ADMIN' || user.role === 'MODERATOR' || user.role === 'ADMIN') && (
                 <Link to="/admin" className="ml-2 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-md text-[10px] font-black uppercase tracking-wider hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors">
                     Admin
                 </Link>
             )}
          </div>

        </div>
      </div>
    </header>
  );
};

export default Header;
