
import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ICONS } from '../constants';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const activeLinkClass = 'bg-gray-200 dark:bg-gray-700 text-indigo-500';
  const inactiveLinkClass = 'hover:bg-gray-200 dark:hover:bg-gray-700';

  const navLinkClasses = `px-3 py-2 rounded-md text-sm font-medium transition-colors`;

  const renderNavLinks = (isMobile: boolean = false) => (
    <>
      <NavLink to="/" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClass : inactiveLinkClass}`}>Home</NavLink>
      <NavLink to="/my-items" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClass : inactiveLinkClass}`}>My Items</NavLink>
      <NavLink to="/exchanges" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClass : inactiveLinkClass}`}>Exchanges</NavLink>
      <NavLink to="/profile" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClass : inactiveLinkClass}`}>Profile</NavLink>
    </>
  );

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center gap-2 text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              <span className="transform rotate-12">{ICONS.swap}</span>
              Swapit
            </Link>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {user ? (
                <>
                  {renderNavLinks()}
                </>
              ) : null}
            </div>
          </div>
          <div className="hidden md:block">
            {user ? (
              <div className="ml-4 flex items-center md:ml-6">
                <span className="text-gray-600 dark:text-gray-300 mr-4">Hi, {user.name}</span>
                <button onClick={logout} className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                  {ICONS.logout} Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700">Log in</Link>
                <Link to="/register" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">Sign up</Link>
              </div>
            )}
          </div>
          <div className="-mr-2 flex md:hidden">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="bg-gray-100 dark:bg-gray-700 inline-flex items-center justify-center p-2 rounded-md text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none">
              <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {user ? (
              <>
                {renderNavLinks(true)}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 pb-3">
                   <div className="flex items-center px-2">
                      <span className="text-gray-600 dark:text-gray-300 text-base font-medium">Hi, {user.name}</span>
                   </div>
                   <div className="mt-3 px-2 space-y-1">
                      <button onClick={logout} className="w-full text-left flex items-center gap-2 rounded-md py-2 px-3 text-base font-medium text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700">
                         {ICONS.logout} Logout
                      </button>
                   </div>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-gray-100 dark:hover:bg-gray-700">Log in</Link>
                <Link to="/register" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-gray-100 dark:hover:bg-gray-700">Sign up</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
