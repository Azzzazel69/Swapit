
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
        if (title === "¡Matches Directos!") return null; 
        if (title === "De tus Swappers Favoritos") return null; 

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
    if (!query.trim()) return items;
    const lowercasedQuery = query.toLowerCase();
    if (type === 'articles') {
        return items.filter(item =>
            (item.title && typeof item.title === 'string' && item.title.toLowerCase().includes(lowercasedQuery)) ||
            (item.description && typeof item.description === 'string' && item.description.toLowerCase().includes(lowercasedQuery))
        );
    } else { 
        return items.filter(item =>
            item.ownerLocation && (
                item.ownerLocation.city.toLowerCase().includes(lowercasedQuery) ||
                item.ownerLocation.postalCode.toLowerCase().includes(lowercasedQuery)
            )
        );
    }
};

const HomePage = () => {
  const { user, updateUser } = useAuth();
  const { theme } = useColorTheme();
  
  const [columnLayout, setColumnLayout] = useState(() => {
    if (typeof window !== 'undefined') {
        const saved = window.localStorage.getItem('swapit_column_layout');
        if (saved) return parseInt(saved, 10);
    }
    if (user?.columnLayout) return user.columnLayout;
    if (typeof window !== 'undefined') return window.innerWidth < 768 ? 2 : 4;
    return 2;
  });

  // Efecto para detectar cambios de tamaño de pantalla si no hay preferencia fija
  useEffect(() => {
    const handleResize = () => {
        const saved = window.localStorage.getItem('swapit_column_layout');
        if (!saved && !user?.columnLayout) {
            setColumnLayout(window.innerWidth < 768 ? 2 : 4);
        }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [user?.columnLayout]);

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
  const [searchType, setSearchType] = useState('articles'); 
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
  const searchDropdownRef = useRef(null);
  const observer = useRef<IntersectionObserver>(null);

  const handleSetLayout = async (newLayout) => {
    setColumnLayout(newLayout);
    if (typeof window !== 'undefined') {
        window.localStorage.setItem('swapit_column_layout', newLayout.toString());
    }
    if (user) {
        try { await api.updateUserColumnLayout(newLayout); } catch (e) {}
    }
  };

  const loadMoreItems = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
        const nextPage = page + 1;
        const data = await api.getHomePageData({ page: nextPage, limit: PAGE_SIZE });
        setExploreItems(prev => [...prev, ...data.exploreItems]);
        setPage(nextPage);
        setHasMore((exploreItems.length + data.exploreItems.length) < data.totalExploreItems);
    } catch (err) { console.error(err); } finally { setLoadingMore(false); }
  }, [page, loadingMore, hasMore, exploreItems.length]);

  const loaderRef = useCallback(node => {
      if (loading || loadingMore) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver(entries => {
          if (entries[0].isIntersecting && hasMore) loadMoreItems();
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
      } catch (err) { setError('Error al cargar artículos.'); } finally { setLoading(false); }
    };
    if (user) fetchItems();
  }, [user]);

  const handleToggleFavorite = async (itemId) => {
    try {
        const updatedItem = await api.toggleFavorite(itemId);
        const updater = (prev) => prev.map(i => i.id === itemId ? { ...i, ...updatedItem } : i);
        setDirectMatches(updater); setRecommended(updater); setExploreItems(updater); setFollowedUsersItems(updater);
    } catch (error) { console.error(error); }
  };

  const filteredMatches = useMemo(() => applySearch(directMatches, searchQuery, searchType), [directMatches, searchQuery, searchType]);
  const filteredRecommended = useMemo(() => applySearch(recommended, searchQuery, searchType), [recommended, searchQuery, searchType]);
  const filteredExplore = useMemo(() => applySearch(exploreItems, searchQuery, searchType), [exploreItems, searchQuery, searchType]);
  const filteredFollowed = useMemo(() => applySearch(followedUsersItems, searchQuery, searchType), [followedUsersItems, searchQuery, searchType]);

  if (loading && exploreItems.length === 0) {
    return (
      React.createElement("div", null,
        React.createElement("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6" },
          [...Array(8)].map((_, i) => React.createElement(ItemCardSkeleton, { key: i }))
        )
      )
    );
  }

  return React.createElement("div", null,
    React.createElement("div", { className: "mb-6 flex flex-col md:flex-row gap-4 justify-between md:items-center" },
      React.createElement("div", { className: "w-full md:w-1/2 lg:w-1/3" },
          React.createElement("form", { className: "flex items-center" },
              React.createElement("div", { className: "relative", ref: searchDropdownRef },
                  React.createElement("button", { 
                      type: "button",
                      onClick: () => setSearchDropdownOpen(prev => !prev),
                      className: "flex-shrink-0 z-10 inline-flex items-center py-2.5 px-4 text-sm font-medium text-center text-gray-900 bg-gray-100 border border-gray-300 rounded-l-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-white"
                  },
                      searchType === 'articles' ? 'Artículos' : 'Ubicación',
                      React.createElement("svg", { className: "w-2.5 h-2.5 ml-2.5", fill: "none", viewBox: "0 0 10 6" },
                          React.createElement("path", { stroke: "currentColor", strokeWidth: "2", d: "m1 1 4 4 4-4" })
                      )
                  ),
                  searchDropdownOpen && React.createElement("div", { className: "absolute top-full mt-1 z-20 bg-white rounded-lg shadow w-44 dark:bg-gray-700" },
                      React.createElement("ul", { className: "py-2 text-sm text-gray-700 dark:text-gray-200" },
                          React.createElement("li", null, React.createElement("button", { type: "button", className: "w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600", onClick: () => { setSearchType('articles'); setSearchDropdownOpen(false); } }, "Artículos")),
                          React.createElement("li", null, React.createElement("button", { type: "button", className: "w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600", onClick: () => { setSearchType('location'); setSearchDropdownOpen(false); } }, "Ubicación"))
                      )
                  )
              ),
              React.createElement("div", { className: "relative w-full" },
                  React.createElement("input", {
                      type: "search",
                      className: `block p-2.5 w-full z-10 text-sm text-gray-900 bg-gray-50 rounded-r-lg border border-l-0 border-gray-300 focus:ring-2 ${theme.focus} dark:bg-gray-700 dark:text-white`,
                      placeholder: searchType === 'articles' ? "Buscar..." : "Ciudad o código postal...",
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

    React.createElement(ItemGroup, { title: "De tus Swappers Favoritos", icon: "⭐", items: filteredFollowed, onToggleFavorite: handleToggleFavorite, emptyMessage: "No hay novedades.", columns: columnLayout }),
    React.createElement(ItemGroup, { title: "¡Matches Directos!", icon: "⚡️", items: filteredMatches, onToggleFavorite: handleToggleFavorite, emptyMessage: "Sin matches por ahora.", columns: columnLayout }),
    React.createElement(ItemGroup, { title: "Recomendado para Ti", icon: "❤️", items: filteredRecommended, onToggleFavorite: handleToggleFavorite, emptyMessage: "Nada que recomendar hoy.", columns: columnLayout }),
    React.createElement(ItemGroup, { title: "Explorar", icon: "🌍", items: filteredExplore, onToggleFavorite: handleToggleFavorite, emptyMessage: "No hay artículos.", columns: columnLayout }),
    
    React.createElement("div", { ref: loaderRef }),
    loadingMore && React.createElement("div", { className: "flex justify-center py-8" }, React.createElement(SwapSpinner, null)),
    
    React.createElement(Link, {
        to: "/add-item",
        className: `fixed bottom-6 right-6 bg-gradient-to-r ${theme.bg} text-white rounded-full p-4 shadow-lg hover:scale-110 transition-transform z-40`
    },
      React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-8 w-8", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth:"2" },
        React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M12 4v16m8-8H4" })
      )
    )
  );
};

export default HomePage;
