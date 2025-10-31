import React, { useEffect, useState, useMemo, useRef } from 'react';
import { api } from '../services/api.ts';
import ItemCard from '../components/ItemCard.tsx';
import Spinner from '../components/Spinner.tsx';
import { useAuth } from '../hooks/useAuth.tsx';
import { useColorTheme } from '../hooks/useColorTheme.tsx';
import { Link } from 'react-router-dom';

const HomePage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('articles'); // 'articles' or 'location'
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
  const searchDropdownRef = useRef(null);
  const { user } = useAuth();
  const { theme } = useColorTheme();
  
  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        const allItems = await api.getAllItems();
        const otherUsersItems = allItems.filter(item => item.userId !== user?.id && item.status !== 'EXCHANGED');
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

  useEffect(() => {
    const handleClickOutside = (event) => {
        if (searchDropdownRef.current && !searchDropdownRef.current.contains(event.target)) {
            setSearchDropdownOpen(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
        document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleToggleFavorite = async (itemId) => {
    try {
        const updatedItem = await api.toggleFavorite(itemId);
        setItems(prevItems => prevItems.map(item => item.id === itemId ? { ...item, ...updatedItem } : item));
    } catch (error) {
        console.error("Error toggling favorite", error);
        setError("No se pudo actualizar el estado de favorito.");
    }
  };

  const filteredItems = useMemo(() => {
    let tempItems = items;
    
    if (filter === 'recommended' && user?.preferences?.length) {
      tempItems = tempItems.filter(item => user.preferences.includes(item.category));
    }

    if (searchQuery.trim()) {
      const lowercasedQuery = searchQuery.toLowerCase();
      if (searchType === 'articles') {
        tempItems = tempItems.filter(item => 
          item.title.toLowerCase().includes(lowercasedQuery) || 
          item.description.toLowerCase().includes(lowercasedQuery)
        );
      } else { // searchType === 'location'
        tempItems = tempItems.filter(item => 
          item.ownerLocation && (
            item.ownerLocation.city.toLowerCase().includes(lowercasedQuery) ||
            item.ownerLocation.postalCode.toLowerCase().includes(lowercasedQuery)
          )
        );
      }
    }
    
    return tempItems;
  }, [items, filter, user, searchQuery, searchType]);

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
      return `No se encontraron resultados para "${searchQuery}".`;
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
        }, "Sube tu artículo +")
    ),
    
    React.createElement("div", { className: "mb-6 flex flex-col md:flex-row gap-4 justify-between items-center" },
        React.createElement("div", { className: "w-full md:w-1/2 lg:w-1/3" },
            React.createElement("form", { className: "flex items-center" },
                React.createElement("div", { className: "relative", ref: searchDropdownRef },
                    React.createElement("button", { 
                        type: "button",
                        onClick: () => setSearchDropdownOpen(prev => !prev),
                        className: "flex-shrink-0 z-10 inline-flex items-center py-2.5 px-4 text-sm font-medium text-center text-gray-900 bg-gray-100 border border-gray-300 rounded-l-lg hover:bg-gray-200 focus:ring-2 focus:outline-none focus:ring-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:focus:ring-gray-500 dark:text-white dark:border-gray-600"
                    },
                        searchType === 'articles' ? 'Artículos' : 'Ubicación',
                        React.createElement("svg", { className: "w-2.5 h-2.5 ml-2.5", "aria-hidden": "true", xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 10 6" },
                            React.createElement("path", { stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "m1 1 4 4 4-4" })
                        )
                    ),
                    searchDropdownOpen && React.createElement("div", { className: "absolute top-full mt-1 z-20 bg-white divide-y divide-gray-100 rounded-lg shadow w-44 dark:bg-gray-700" },
                        React.createElement("ul", { className: "py-2 text-sm text-gray-700 dark:text-gray-200" },
                            React.createElement("li", null, 
                                React.createElement("button", { 
                                    type: "button", 
                                    className: "inline-flex w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white",
                                    onClick: () => { setSearchType('articles'); setSearchDropdownOpen(false); }
                                }, "Artículos")
                            ),
                            React.createElement("li", null, 
                                React.createElement("button", { 
                                    type: "button", 
                                    className: "inline-flex w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white",
                                    onClick: () => { setSearchType('location'); setSearchDropdownOpen(false); }
                                }, "Ubicación")
                            )
                        )
                    )
                ),
                React.createElement("div", { className: "relative w-full" },
                    React.createElement("input", {
                        type: "search",
                        className: `block p-2.5 w-full z-10 text-sm text-gray-900 bg-gray-50 rounded-r-lg border border-l-0 border-gray-300 focus:ring-2 ${theme.focus} ${theme.border} dark:bg-gray-700 dark:border-l-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white`,
                        placeholder: searchType === 'articles' ? "Buscar por título o descripción..." : "Buscar por ciudad o código postal...",
                        value: searchQuery,
                        onChange: (e) => setSearchQuery(e.target.value)
                    })
                )
            )
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
        filteredItems.map((item) => React.createElement(ItemCard, { key: item.id, item: item, onToggleFavorite: handleToggleFavorite }))
      )
    )
  );
};

export default HomePage;