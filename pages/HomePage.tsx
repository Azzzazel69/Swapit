
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { api, viewHistoryService } from '../services/api.ts';
import ItemCard from '../components/ItemCard.tsx';
import SwapSpinner from '../components/SwapSpinner.tsx';
import { useAuth } from '../hooks/useAuth.tsx';
import { useColorTheme } from '../hooks/useColorTheme.tsx';
import { Link } from 'react-router-dom';

const ItemGroup = ({ title, icon, items, onToggleFavorite, emptyMessage, columns = 2 }) => {
    if (!items || items.length === 0) {
        if (title === "¡Matches Directos!") return null; // Ocultar si no hay matches
        
        return (
            React.createElement("div", { className: "mb-12" },
                React.createElement("h2", { className: "text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-3" }, icon, title),
                React.createElement("div", { className: "text-center py-8 px-4 bg-gray-50 dark:bg-gray-800 rounded-lg" },
                    React.createElement("p", { className: "text-gray-500 dark:text-gray-400" }, emptyMessage)
                )
            )
        );
    }
    
    // This new logic respects the user's choice on mobile while ensuring a good layout.
    const gridLayoutClasses = {
        2: 'grid-cols-2',
        3: 'grid-cols-3',
        4: 'grid-cols-3 md:grid-cols-4' // On the smallest screens, limit 4 columns to 3 to prevent overflow.
    };


    return (
        React.createElement("div", { className: "mb-12" },
            React.createElement("h2", { className: "text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-3" }, icon, title),
            React.createElement("div", { className: `grid ${gridLayoutClasses[columns] || 'grid-cols-2'} gap-4` },
                items.map(item => React.createElement(ItemCard, { key: item.id, item: item, onToggleFavorite: onToggleFavorite }))
            )
        )
    );
};

const LayoutSelector = ({ layout, setLayout }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const options = [2, 3, 4];
    const icons = {
        2: React.createElement("div", { className: "flex gap-0.5", title:"2 columnas" }, React.createElement("div", { className: "w-3 h-4 bg-gray-500 rounded-sm" }), React.createElement("div", { className: "w-3 h-4 bg-gray-500 rounded-sm" })),
        3: React.createElement("div", { className: "flex gap-0.5", title:"3 columnas" }, React.createElement("div", { className: "w-2 h-4 bg-gray-500 rounded-sm" }), React.createElement("div", { className: "w-2 h-4 bg-gray-500 rounded-sm" }), React.createElement("div", { className: "w-2 h-4 bg-gray-500 rounded-sm" })),
        4: React.createElement("div", { className: "flex gap-0.5", title:"4 columnas" }, React.createElement("div", { className: "w-1.5 h-4 bg-gray-500 rounded-sm" }), React.createElement("div", { className: "w-1.5 h-4 bg-gray-500 rounded-sm" }), React.createElement("div", { className: "w-1.5 h-4 bg-gray-500 rounded-sm" }), React.createElement("div", { className: "w-1.5 h-4 bg-gray-500 rounded-sm" })),
    };

    return (
        React.createElement("div", { className: "relative", ref: wrapperRef },
            React.createElement("button", {
                onClick: () => setIsOpen(prev => !prev),
                className: "p-1.5 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
            }, icons[layout]),
            isOpen && React.createElement("div", {
                className: "absolute bottom-full right-0 mb-2 p-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 flex flex-row gap-1"
            }, options.map(opt => (
                React.createElement("button", {
                    key: opt,
                    onClick: () => { setLayout(opt); setIsOpen(false); },
                    className: `p-2 rounded-md transition-colors ${layout === opt ? 'bg-blue-100 dark:bg-blue-900' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`
                }, icons[opt])
            )))
        )
    );
};


const HomePage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('articles'); // 'articles' or 'location'
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
  const searchDropdownRef = useRef(null);
  const { user } = useAuth();
  const { theme } = useColorTheme();
  
  const [columnLayout, setColumnLayout] = useState(() => {
    if (typeof window !== 'undefined') {
        const savedLayout = window.localStorage.getItem('item_layout_columns');
        if (savedLayout) {
            return Number(savedLayout);
        }
        // Set default based on screen size if nothing is saved
        return window.innerWidth < 768 ? 2 : 4;
    }
    return 2; // Fallback for SSR/build time
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
        window.localStorage.setItem('item_layout_columns', columnLayout.toString());
    }
  }, [columnLayout]);
  
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

  const groupedItems = useMemo(() => {
    let searchedItems = items;
    if (searchQuery.trim()) {
        const lowercasedQuery = searchQuery.toLowerCase();
        if (searchType === 'articles') {
            searchedItems = items.filter(item =>
                item.title.toLowerCase().includes(lowercasedQuery) ||
                item.description.toLowerCase().includes(lowercasedQuery)
            );
        } else { // searchType === 'location'
            searchedItems = items.filter(item =>
                item.ownerLocation && (
                    item.ownerLocation.city.toLowerCase().includes(lowercasedQuery) ||
                    item.ownerLocation.postalCode.toLowerCase().includes(lowercasedQuery)
                )
            );
        }
    }

    const viewHistory = viewHistoryService.getHistory();
    const categoryFrequencies = viewHistory.reduce((acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + 1;
        return acc;
    }, {});

    const itemsWithScores = searchedItems.map(item => {
        const historyScore = categoryFrequencies[item.category] || 0;
        const preferenceScore = user?.preferences?.includes(item.category) ? 1 : 0;
        const score = (historyScore * 3) + preferenceScore;
        return { ...item, recommendationScore: score };
    });

    const directMatches = [];
    const recommended = [];
    const newArrivals = [];
    const nearbyItems = [];
    const displayedIds = new Set();
    
    // 1. Direct Matches
    itemsWithScores.forEach(item => {
        if (item.isMatch) {
            directMatches.push(item);
            displayedIds.add(item.id);
        }
    });

    // 2. Recommended by user history and preferences
    const potentialRecommendations = itemsWithScores
        .filter(item => !displayedIds.has(item.id) && item.recommendationScore > 0)
        .sort((a, b) => b.recommendationScore - a.recommendationScore);
    
    potentialRecommendations.forEach(item => {
        recommended.push(item);
        displayedIds.add(item.id);
    });
    
    const remaining = itemsWithScores.filter(item => !displayedIds.has(item.id));
    
    // 3. New Arrivals (sort remaining by date)
    const sortedByDate = [...remaining].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const NEW_ARRIVALS_COUNT = 8;
    newArrivals.push(...sortedByDate.slice(0, NEW_ARRIVALS_COUNT));
    newArrivals.forEach(item => displayedIds.add(item.id));
    
    // 4. Nearby (the rest of the items, sorted by location)
    const lastRemaining = sortedByDate.slice(NEW_ARRIVALS_COUNT);
    if (user?.location) {
        lastRemaining.sort((a, b) => {
            const aScore = a.ownerLocation?.postalCode === user.location.postalCode ? 2 : a.ownerLocation?.city === user.location.city ? 1 : 0;
            const bScore = b.ownerLocation?.postalCode === user.location.postalCode ? 2 : b.ownerLocation?.city === user.location.city ? 1 : 0;
            if (aScore !== bScore) return bScore - aScore;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); // secondary sort by newest
        });
    }
    nearbyItems.push(...lastRemaining);

    return { directMatches, recommended, newArrivals, nearbyItems };
  }, [items, user, searchQuery, searchType]);


  if (loading) {
    return React.createElement("div", { className: "flex justify-center items-center h-64" }, React.createElement(SwapSpinner, null));
  }

  if (error) {
    return React.createElement("div", { className: "text-center text-red-500" }, error);
  }

  return React.createElement("div", null,
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
      React.createElement("div", { className: "flex items-center gap-4" },
        React.createElement(LayoutSelector, { layout: columnLayout, setLayout: setColumnLayout }),
        React.createElement(Link, {
            to: "/add-item",
            className: `flex items-center gap-2 bg-gradient-to-r ${theme.bg} ${theme.hoverBg} text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm`
        }, "Sube tu artículo +")
      )
    ),

    React.createElement(ItemGroup, {
        title: "¡Matches Directos!",
        icon: "⚡️",
        items: groupedItems.directMatches,
        onToggleFavorite: handleToggleFavorite,
        emptyMessage: "No hemos encontrado ningún match directo. ¡Prueba a añadir qué buscas en tus artículos!",
        columns: columnLayout
    }),
    React.createElement(ItemGroup, {
        title: "Recomendado para Ti",
        icon: "❤️",
        items: groupedItems.recommended,
        onToggleFavorite: handleToggleFavorite,
        emptyMessage: "No hay recomendaciones por ahora. ¡Empieza a explorar artículos para que aprendamos qué te gusta!",
        columns: columnLayout
    }),
    React.createElement(ItemGroup, {
        title: "Novedades",
        icon: "✨",
        items: groupedItems.newArrivals,
        onToggleFavorite: handleToggleFavorite,
        emptyMessage: "No hay artículos nuevos en este momento.",
        columns: columnLayout
    }),
    React.createElement(ItemGroup, {
        title: "Cerca de Ti",
        icon: "📍",
        items: groupedItems.nearbyItems,
        onToggleFavorite: handleToggleFavorite,
        emptyMessage: "No hay más artículos disponibles en tu zona.",
        columns: columnLayout
    }),

  );
};

export default HomePage;