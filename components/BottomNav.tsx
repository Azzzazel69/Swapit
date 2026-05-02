import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useColorTheme } from '../hooks/useColorTheme.tsx';
import NotificationBadge from './NotificationBadge.tsx';
import { ICONS } from '../constants.tsx';
import { useAuth } from '../hooks/useAuth.tsx';

const BottomNav = () => {
  const { theme } = useColorTheme();
  const location = useLocation();
  const { user } = useAuth();

  const isFullScreenPage = location.pathname.startsWith('/meeting-map') || location.pathname.startsWith('/chat') || location.pathname.startsWith('/exploration');
  const isAuthPage = ['/login', '/register', '/forgot-password', '/onboarding'].includes(location.pathname);

  if (isFullScreenPage || isAuthPage) return null;

  const navItems = [
    { path: '/', icon: ICONS.home || '🏠', label: 'Inicio' },
    { path: '/exploration', icon: ICONS.explore || '🗂️', label: 'Explorar' },
    { path: '/add-item', icon: '➕', label: 'Publicar', isCenter: true },
    { path: '/exchanges', icon: ICONS.envelope || '💬', label: 'Mensajes', hasBadge: true },
    { path: '/profile', icon: ICONS.user || '👤', label: 'Perfil' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 pb-[env(safe-area-inset-bottom)] z-50">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item, index) => {
          const isActive = location.pathname === item.path || (item.path === '/profile' && location.pathname.startsWith('/user/'));
          
          if (item.isCenter) {
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className="relative -top-3 flex flex-col items-center justify-center w-14 h-14 rounded-full bg-white dark:bg-gray-900 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] border border-gray-100 dark:border-gray-800"
              >
                <div className={`flex items-center justify-center w-12 h-12 rounded-full font-bold text-white transition-transform ${isActive ? 'scale-95' : 'hover:scale-105'}`} style={{ background: 'linear-gradient(135deg, var(--tw-gradient-from, #f97316), var(--tw-gradient-to, #f59e0b))' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </div>
              </NavLink>
            );
          }

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors ${isActive ? 'text-orange-500' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
            >
              <div className="relative flex items-center justify-center h-7 w-7">
                {typeof item.icon === 'string' ? (
                  <span className="text-xl">{item.icon}</span>
                ) : (
                  item.icon
                )}
                {item.hasBadge && <NotificationBadge />}
              </div>
              <span className={`text-[10px] font-medium ${isActive ? 'font-bold' : ''}`}>{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
