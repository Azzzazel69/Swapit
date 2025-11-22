
import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { api } from '../services/api.ts';
import ItemCard from '../components/ItemCard.tsx';
import SwapSpinner from '../components/SwapSpinner.tsx';
import { useAuth } from '../hooks/useAuth.tsx';
import { useColorTheme } from '../hooks/useColorTheme.tsx';
import { Link } from 'react-router-dom';
import ItemCardSkeleton from '../components/ItemCardSkeleton.tsx';

const PAGE_SIZE = 12;

const ItemGroup = ({ title, icon, items, onToggleFavorite, emptyMessage, columns = 2 }) => {
    const { theme } = useColorTheme();

    if (!items || items.length === 0) {
        if (title === "¡Matches Directos!") return null; // Ocultar si no hay matches
        if (title === "De tus Swappers Favoritos") return null; // Ocultar si no hay items de seguidos

        return (
            React.createElement("div", { className: "mb-12" },
                React.createElement("h2", { className: `text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-sm border-l-4 ${theme.border}` }, icon, title),
                React.createElement("div", { className: "text-center py-8 px-4 bg-gray-50 dark:bg-gray-800 rounded-lg" },
                    React.createElement("p", { className: "text-gray-500 dark:text-gray-400" }, emptyMessage)
                )
            )
        );
    }
    
    const gridLayoutClasses = {
        1: 'grid-cols-1',
        2: 'grid-cols-2',
        3: 'grid-cols-3',
        4: 'grid-cols-4',
    };


    return (
        React.createElement("div", { className: "mb-12" },
            React.createElement("h2", { className: `text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-sm border-l-4 ${theme.border}` }, icon, title),
            React.createElement("div", { className: `grid ${gridLayoutClasses[columns] || 'grid-cols-2'} gap-4 md:gap-6` },
                // Fix: Pass missing 'onDelete' and 'deletingItemId' props to ItemCard
                items.map(item => React.createElement(ItemCard, { key: item.id, item: item, onToggleFavorite: onToggleFavorite, columns: columns, onDelete: undefined, deletingItemId: undefined }))
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

    const options = [1, 2, 3, 4];
    const icons = {
        1: React.createElement("div", { className: "flex gap-0.5", title:"1 columna" }, React.createElement("div", { className: "w-4 h-4 bg-gray-500 rounded-sm" })),
        2: React.createElement("div", { className: "flex gap-0.5", title:"2 columnas" }, React.createElement("div", { className: "w-3 h-4 bg-gray-500 rounded-sm" }), React.createElement("div", { className: "w-3 h-4 bg-gray-500 rounded-sm" })),
        3: React.createElement("div", { className: "flex gap-0.5", title:"3 columnas" }, React.createElement("div", { className: "w-2 h-4 bg-gray-500 rounded-sm" }), React.createElement("div", { className: "w-2 h-4 bg-gray-500 rounded-sm" }), React.createElement("div", { className: "w-2 h-4 bg-gray-500 rounded-sm" })),
        4: React.createElement("div", { className: "flex gap-0.5", title:"4 columnas" }, React.createElement("div", { className: "w-1.5 h-4 bg-gray-500 rounded-sm" }), React.createElement("div", { className: "w-1.5 h-4 bg-gray-500 rounded-sm" }), React.createElement("div", { className: "w-1.5 h-4 bg-gray-500 rounded-sm" }), React.createElement("div", { className: "w-1.5 h-4 bg-gray-500 rounded-sm" })),
    };

    const handleSelect = (option) => {
        setLayout(option);
        setIsOpen(false);
    };

    return (
        React.createElement("div", { className: "flex items-center justify-end gap-2", ref: wrapperRef },
             React.createElement("span", {
                className: `text-sm font-medium text-gray-600 dark:text-gray-400 transition-all duration-300 ease-in-out ${isOpen ? 'max-w-xs opacity-100 mr-2' : 'max-w-0 opacity-0'} overflow-hidden whitespace-nowrap`,
            }, "Artículos por línea"),
            React.createElement("div", { className: `flex items-center p-1 bg-gray-200 dark:bg-gray-700 rounded-full transition-all duration-300 ease-in-out` },
                !isOpen && React.createElement("button", {
                    onClick: () => setIsOpen(true),
                    className: `p-1.5 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600`
                }, icons[layout]),
                
                isOpen && [...options].reverse().map(opt => (
                    React.createElement("button", {
                        key: opt,
                        onClick: () => handleSelect(opt),
                        className: `p-1.5 rounded-full transition-colors ml-1 first:ml-0 ${layout === opt ? 'bg-blue-100 dark:bg-blue-900' : 'hover:bg-gray-300 dark:hover:bg-gray-600'}`
                    }, icons[opt])
                ))
            )
        )
    );
};

const applySearch = (items, query, type) => {
    if (!query.trim()) {
        return items;
    }
    const lowercasedQuery = query.toLowerCase();
    if (type === 'articles') {
        return items.filter(item =>
            (item.title && typeof item.title === 'string' && item.title.toLowerCase().includes(lowercasedQuery)) ||
            (item.description && typeof item.description === 'string' && item.description.toLowerCase().includes(lowercasedQuery))
        );
    } else { // searchType === 'location'
        return items.filter(item =>
            item.ownerLocation && (
                item.ownerLocation.city.toLowerCase().includes(lowercasedQuery) ||
                item.ownerLocation.postalCode.toLowerCase().includes(lowercasedQuery)
            )
        );
    }
};


const HomePage = () => {
  const [directMatches, setDirectMatches] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [exploreItems, setExploreItems] = useState([]);
  const [followedUsersItems, setFollowedUsersItems] = useState([]);
  const [totalExploreItems, setTotalExploreItems] = useState(0);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('articles'); // 'articles' or 'location'
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
  const searchDropdownRef = useRef(null);
  const { user, updateUser } = useAuth();
  const { theme } = useColorTheme();
  
  const [columnLayout, setColumnLayout] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
        const savedLayout = window.localStorage.getItem('swapit_column_layout');
        if (savedLayout && !isNaN(parseInt(savedLayout, 10))) {
            return parseInt(savedLayout, 10);
        }
    }
    if (user?.columnLayout) {
        return user.columnLayout;
    }
    if (typeof window !== 'undefined') {
        return window.innerWidth < 768 ? 2 : 4;
    }
    return 2;
  });
  
    useEffect(() => {
        if (user?.columnLayout && user.columnLayout !== columnLayout) {
            setColumnLayout(user.columnLayout);
            if (typeof window !== 'undefined') {
                window.localStorage.setItem('swapit_column_layout', user.columnLayout.toString());
            }
        }
    }, [user, columnLayout]);

    const handleSetLayout = async (newLayout) => {
        if (newLayout === columnLayout) return;
        
        const oldLayout = columnLayout;
        setColumnLayout(newLayout);

        if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem('swapit_column_layout', newLayout.toString());
        }

        if (user) {
            updateUser({ ...user, columnLayout: newLayout });
            try {
                await api.updateUserColumnLayout(newLayout);
            } catch (error) {
                console.error("Failed to save layout preference:", error);
                setColumnLayout(oldLayout);
                updateUser({ ...user, columnLayout: oldLayout });
                if (typeof window !== 'undefined' && window.localStorage) {
                    window.localStorage.setItem('swapit_column_layout', oldLayout.toString());
                }
            }
        }
    };
  
  // Fix: Add type to useRef for IntersectionObserver
  const observer = useRef<IntersectionObserver>(null);

  const loadMoreItems = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
        const nextPage = page + 1;
        const data = await api.getHomePageData({ page: nextPage, limit: PAGE_SIZE });
        setExploreItems(prev => [...prev, ...data.exploreItems]);
        setPage(nextPage);
        setHasMore((exploreItems.length + data.exploreItems.length) < data.totalExploreItems);
    } catch (err) {
        console.error("Failed to load more items", err);
    } finally {
        setLoadingMore(false);
    }
  }, [page, loadingMore, hasMore, exploreItems.length]);

  const loaderRef = useCallback(node => {
      if (loading || loadingMore) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver(entries => {
          if (entries[0].isIntersecting && hasMore) {
              loadMoreItems();
          }
      });
      if (node) observer.current.observe(node);
  }, [loading, loadingMore, hasMore, loadMoreItems]);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        const data = await api.getHomePageData({ page: 1, limit: PAGE_SIZE });
        setDirectMatches(data.directMatches || []);
        setRecommended(data.recommended || []);
        setExploreItems(data.exploreItems || []);
        setFollowedUsersItems(data.followedUsersItems || []);
        setTotalExploreItems(data.totalExploreItems || 0);
        setHasMore((data.exploreItems?.length || 0) < (data.totalExploreItems || 0));
        setPage(1);
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
        const updater = (prevItems) => prevItems.map(item => item.id === itemId ? { ...item, ...updatedItem } : item);
        setDirectMatches(updater);
        setRecommended(updater);
        setExploreItems(updater);
        setFollowedUsersItems(updater);
    } catch (error) {
        console.error("Error toggling favorite", error);
        setError("No se pudo actualizar el estado de favorito.");
    }
  };

  const filteredMatches = useMemo(() => applySearch(directMatches, searchQuery, searchType), [directMatches, searchQuery, searchType]);
  const filteredRecommended = useMemo(() => applySearch(recommended, searchQuery, searchType), [recommended, searchQuery, searchType]);
  const filteredExplore = useMemo(() => applySearch(exploreItems, searchQuery, searchType), [exploreItems, searchQuery, searchType]);
  const filteredFollowed = useMemo(() => applySearch(followedUsersItems, searchQuery, searchType), [followedUsersItems, searchQuery, searchType]);


  if (loading && exploreItems.length === 0) {
    const skeletonCount = 8;
    const gridLayoutClasses = {
        1: 'grid-cols-1',
        2: 'grid-cols-2',
        3: 'grid-cols-3',
        4: 'grid-cols-4',
    };
    return (
      React.createElement("div", null,
        React.createElement("div", { className: "mb-6 flex flex-col md:flex-row gap-4 justify-between items-center" },
            React.createElement("div", { className: "h-11 bg-gray-200 dark:bg-gray-700 rounded-lg w-full md:w-1/2 lg:w-1/3 animate-pulse" }),
            React.createElement("div", { className: "h-11 bg-gray-200 dark:bg-gray-700 rounded-full w-24 animate-pulse" })
        ),
        React.createElement("div", { className: "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6" },
          [...Array(skeletonCount)].map((_, i) => React.createElement(ItemCardSkeleton, { key: i }))
        )
      )
    );
  }

  if (error && exploreItems.length === 0) {
    return React.createElement("div", { className: "text-center text-red-500" }, error);
  }

  return React.createElement("div", null,
    React.createElement("div", { className: "mb-6 flex flex-col md:flex-row gap-4 justify-between md:items-center" },
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
      React.createElement("div", { className: "w-full md:w-auto flex justify-end" },
        React.createElement(LayoutSelector, { layout: columnLayout, setLayout: handleSetLayout })
      )
    ),

    React.createElement(ItemGroup, {
        title: "De tus Swappers Favoritos",
        icon: "⭐",
        items: filteredFollowed,
        onToggleFavorite: handleToggleFavorite,
        emptyMessage: "Los usuarios que sigues aún no han subido nada nuevo.",
        columns: columnLayout
    }),

    React.createElement(ItemGroup, {
        title: "¡Matches Directos!",
        icon: "⚡️",
        items: filteredMatches,
        onToggleFavorite: handleToggleFavorite,
        emptyMessage: "No hemos encontrado ningún match directo. ¡Prueba a añadir qué buscas en tus artículos!",
        columns: columnLayout
    }),
    React.createElement(ItemGroup, {
        title: "Recomendado para Ti",
        icon: "❤️",
        items: filteredRecommended,
        onToggleFavorite: handleToggleFavorite,
        emptyMessage: "No hay recomendaciones por ahora. ¡Empieza a explorar artículos para que aprendamos qué te gusta!",
        columns: columnLayout
    }),
    React.createElement(ItemGroup, {
        title: "Explorar",
        icon: "🌍",
        items: filteredExplore,
        onToggleFavorite: handleToggleFavorite,
        emptyMessage: "No hay artículos disponibles en este momento.",
        columns: columnLayout
    }),
    
    React.createElement("div", { ref: loaderRef }),
    loadingMore && (
        React.createElement("div", { className: "flex justify-center items-center h-24" },
            React.createElement(SwapSpinner, null)
        )
    ),
    !hasMore && exploreItems.length > 0 && !loading && (
        React.createElement("p", { className: "text-center text-gray-500 dark:text-gray-400 py-8" },
            "¡Has llegado al final! No hay más artículos por ahora."
        )
    ),
    
    React.createElement(Link, {
        to: "/add-item",
        title: "Sube tu artículo",
        className: `group fixed bottom-6 right-6 md:bottom-8 md:right-8 bg-gradient-to-r ${theme.bg} ${theme.hoverBg} text-white rounded-full p-4 shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 ${theme.focus} transition-all duration-300 ease-in-out z-40 flex items-center gap-0 hover:gap-3 hover:pr-6`
    },
      React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-8 w-8 flex-shrink-0", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth:"2" },
        React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M12 4v16m8-8H4" })
      ),
      React.createElement("span", { className: "max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 ease-in-out font-semibold" },
        "Subir artículo"
      )
    )

  );
};

export default HomePage;
