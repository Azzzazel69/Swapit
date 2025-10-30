import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../services/api.js';
import ItemCard from '../components/ItemCard.js';
import Spinner from '../components/Spinner.js';
import { useAuth } from '../hooks/useAuth.tsx';
import { useColorTheme } from '../hooks/useColorTheme.js';
import { Link } from 'react-router-dom';
import { ICONS } from '../constants.js';
import { ExchangeStatus } from '../types.js';

const HomePage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { user, logout } = useAuth();
  const { theme } = useColorTheme();
  const [hasNotifications, setHasNotifications] = useState(false);

  useEffect(() => {
    const checkNotifications = async () => {
      if (!user) {
        setHasNotifications(false);
        return;
      }
      try {
        const exchanges = await api.getExchanges();
        const pendingIncoming = exchanges.some(
          ex => ex.ownerId === user.id && ex.status === ExchangeStatus.Pending
        );
        setHasNotifications(pendingIncoming);
      } catch (error) {
        console.error("Failed to check for notifications:", error);
        setHasNotifications(false);
      }
    };

    if (user) {
        checkNotifications();
        const intervalId = setInterval(checkNotifications, 30000); // Check every 30 seconds
        return () => clearInterval(intervalId);
    }
  }, [user]);
  
  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        const allItems = await api.getAllItems();
        const otherUsersItems = allItems.filter(item => item.userId !== user?.id);
        setItems(otherUsersItems);
        setError(null);
      } catch (err) {
        setError('Error al cargar los artículos. Por favor, inténtalo de nuevo más tarde.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
        fetchItems();
    }
  }, [user]);

  const filteredItems = useMemo(() => {
    let tempItems = items;
    
    if (filter === 'recommended' && user?.preferences?.length) {
      tempItems = tempItems.filter(item => user.preferences.includes(item.category));
    }

    if (searchQuery.trim()) {
      const lowercasedQuery = searchQuery.toLowerCase();
      tempItems = tempItems.filter(item => 
        item.title.toLowerCase().includes(lowercasedQuery) || 
        item.description.toLowerCase().includes(lowercasedQuery)
      );
    }
    
    return tempItems;
  }, [items, filter, user, searchQuery]);

  if (loading) {
    return React.createElement("div", { className: "flex justify-center items-center h-64" }, React.createElement(Spinner, null));
  }

  if (error) {
    return React.createElement("div", { className: "text-center text-red-500" }, error);
  }
  
  const FilterButton = ({ type, label }) => (
    React.createElement("button", { 
      onClick: () => setFilter(type),
      className: `px-4 py-2 text-sm font-medium rounded-lg transition-colors ${filter === type ? `bg-gradient-to-r ${theme.bg} text-white` : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'}`
    }, label)
  );

  const getEmptyMessage = () => {
    if (searchQuery.trim()) {
      return `No se encontraron artículos que coincidan con "${searchQuery}".`;
    }
    if (filter === 'recommended') {
      return "No hay artículos que coincidan con tus preferencias. ¡Intenta ajustar tus intereses en tu perfil!";
    }
    return "No hay artículos disponibles de otros usuarios en este momento.";
  };

  return React.createElement("div", null,
    React.createElement("div", { className: "mb-6 flex justify-between items-center gap-4" },
        React.createElement(Link, {
            to: "/profile?action=add",
            className: `flex items-center gap-2 bg-gradient-to-r ${theme.bg} ${theme.hoverBg} text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm`
        }, "Sube tu artículo +"),
        React.createElement("div", { className: "flex items-center gap-4" },
            React.createElement(Link, { 
                to: "/exchanges", 
                title: "Buzón",
                className: "p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" 
              },
                React.createElement("div", { className: "relative" },
                  ICONS.envelope,
                  hasNotifications && (
                    React.createElement("span", { className: "absolute top-0 right-0 block h-2.5 w-2.5 transform translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-800" })
                  )
                )
              ),
            React.createElement("button", { 
              onClick: logout, 
              title: "Cerrar Sesión",
              className: "p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-red-100 dark:hover:bg-red-800 hover:text-red-500 dark:hover:text-red-400 transition-colors" 
            },
              ICONS.logout
            )
        )
    ),
    
    React.createElement("div", { className: "mb-6 flex flex-col md:flex-row gap-4 justify-between items-center" },
      React.createElement("div", { className: "relative w-full md:w-1/2 lg:w-1/3" },
         React.createElement("span", { className: "absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" },
           React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-5 w-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" }, React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" }))),
         React.createElement("input", {
           type: "text",
           placeholder: "Buscar por título o descripción...",
           value: searchQuery,
           onChange: (e) => setSearchQuery(e.target.value),
           className: `w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 ${theme.focus} bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`,
           "aria-label": "Buscar artículos"
         })
      ),
      React.createElement("div", { className: "flex items-center gap-2" },
        React.createElement(FilterButton, { type: "all", label: "Todos los Artículos" }),
        React.createElement(FilterButton, { type: "recommended", label: "Recomendado para Ti" })
      )
    ),

    filteredItems.length === 0 ? (
      React.createElement("p", { className: "text-center text-gray-500 dark:text-gray-400 mt-10" },
        getEmptyMessage()
      )
    ) : (
      React.createElement("div", { className: "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" },
        filteredItems.map((item) => React.createElement(ItemCard, { key: item.id, item: item }))
      )
    )
  );
};

export default HomePage;