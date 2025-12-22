
import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { api } from '../services/api.ts';
import ItemCard from '../components/ItemCard.tsx';
import SwapSpinner from '../components/SwapSpinner.tsx';
import { useAuth } from '../hooks/useAuth.tsx';
import { useColorTheme } from '../hooks/useColorTheme.tsx';
import { Link } from 'react-router-dom';
import ItemCardSkeleton from '../components/ItemCardSkeleton.tsx';
import Button from '../components/Button.tsx';
import EmptyState from '../components/EmptyState.tsx';
import { ICONS } from '../constants.tsx';

const PAGE_SIZE = 12;

const ItemGroup = ({ title, icon, items, onToggleFavorite, columns = 2, id = "" }) => {
    const { theme } = useColorTheme();
    if (!items || items.length === 0) return null;
    const effectiveColumns = Math.min(items.length, columns);
    const gridLayoutClasses = { 1: 'grid-cols-1', 2: 'grid-cols-2', 3: 'grid-cols-3', 4: 'grid-cols-4' };

    return (
        React.createElement("div", { id: id, className: "mb-12 animate-fade-in-up scroll-mt-20" },
            React.createElement("h2", { className: `text-xl font-black text-gray-900 dark:text-white mb-4 flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm border-l-4 ${theme.border}` }, 
                React.createElement("span", { className: "text-2xl" }, icon), 
                title
            ),
            React.createElement("div", { className: `grid ${gridLayoutClasses[effectiveColumns] || 'grid-cols-2'} gap-4 md:gap-6 transition-all duration-500` },
                items.map(item => React.createElement(ItemCard, { key: item.id, item: item, onToggleFavorite: onToggleFavorite, columns: effectiveColumns }))
            )
        )
    );
};

const ViewSelector = ({ mode, setMode }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const options = [
        { id: 'landing', label: 'Descubrir todo', icon: '✨' },
        { id: 'cerca', label: 'Cerca de mí', icon: '📍' },
        { id: 'favoritos', label: 'Mis Favoritos', icon: '❤️' },
        { id: 'recientes', label: 'Más Recientes', icon: '🕒' }
    ];

    useEffect(() => {
        const clickOut = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false); };
        document.addEventListener('mousedown', clickOut);
        return () => document.removeEventListener('mousedown', clickOut);
    }, []);

    const selected = options.find(o => o.id === mode) || options[0];

    return (
        React.createElement("div", { className: "relative", ref: dropdownRef },
            React.createElement("button", { 
                onClick: () => setIsOpen(!isOpen),
                className: "flex items-center gap-2 px-3 py-2.5 sm:px-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm font-bold text-sm"
            }, 
                React.createElement("span", null, selected.icon),
                React.createElement("span", { className: "hidden sm:inline" }, selected.label),
                React.createElement("svg", { className: `w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`, fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" }, React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M19 9l-7 7-7-7" }))
            ),
            isOpen && React.createElement("div", { className: "absolute left-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl z-50 border border-gray-100 dark:border-gray-700 overflow-hidden" },
                options.map(opt => (
                    React.createElement("button", {
                        key: opt.id,
                        onClick: () => { setMode(opt.id); setIsOpen(false); },
                        className: `w-full flex items-center gap-3 px-4 py-3 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700 ${mode === opt.id ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600' : ''}`
                    }, 
                        React.createElement("span", null, opt.icon),
                        React.createElement("span", { className: "font-bold" }, opt.label)
                    )
                ))
            )
        )
    );
};

const applySearch = (items, query, type) => {
    if (!query.trim()) return items;
    const q = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return items.filter(item => {
        const title = (item.title || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const desc = (item.description || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const city = (item.ownerLocation?.city || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const prov = (item.ownerLocation?.province || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        
        if (type === 'articles') return title.includes(q) || desc.includes(q);
        return city.includes(q) || prov.includes(q);
    });
};

const HomePage = () => {
  const { user } = useAuth();
  const { theme } = useColorTheme();
  
  const [viewMode, setViewMode] = useState('landing');
  const [columnLayout, setColumnLayout] = useState(window.innerWidth < 768 ? 2 : 4);
  const [data, setData] = useState({ exploreItems: [], directMatches: [], recommended: [], nearItems: [], favoriteItems: [], popularItems: [], totalExploreItems: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('articles'); 

  const fetchItems = async (p = 1, append = false) => {
    try {
      if (!append) setLoading(true);
      const res = await api.getHomePageData({ page: p, limit: PAGE_SIZE, viewMode });
      setData(prev => ({
          ...res,
          exploreItems: append ? [...prev.exploreItems, ...res.exploreItems] : res.exploreItems
      }));
      setPage(p);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchItems(1, false); }, [user]);

  const handleToggleFavorite = async (itemId) => {
    try {
        const updated = await api.toggleFavorite(itemId);
        const updater = (prev) => prev.map(i => i.id === itemId ? { ...i, ...updated } : i);
        setData(d => ({ 
            ...d, 
            exploreItems: updater(d.exploreItems), 
            directMatches: updater(d.directMatches), 
            recommended: updater(d.recommended), 
            favoriteItems: updater(d.favoriteItems),
            nearItems: updater(d.nearItems),
            popularItems: updater(d.popularItems)
        }));
    } catch (e) { console.error(e); }
  };

  const filtered = useMemo(() => ({
      matches: applySearch(data.directMatches, searchQuery, searchType),
      rec: applySearch(data.recommended, searchQuery, searchType),
      near: applySearch(data.nearItems, searchQuery, searchType),
      favs: applySearch(data.favoriteItems, searchQuery, searchType),
      popular: applySearch(data.popularItems, searchQuery, searchType),
      explore: applySearch(data.exploreItems, searchQuery, searchType)
  }), [data, searchQuery, searchType]);

  if (loading && page === 1) {
    return (
        React.createElement("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4" }, 
            [...Array(8)].map((_, i) => React.createElement(ItemCardSkeleton, { key: i }))
        )
    );
  }

  const renderCurrentView = () => {
      if (viewMode === 'landing') {
          return React.createElement(React.Fragment, null,
            React.createElement(ItemGroup, { title: "Matches Directos", icon: "⚡️", items: filtered.matches, onToggleFavorite: handleToggleFavorite, columns: columnLayout }),
            React.createElement(ItemGroup, { title: "Tus Favoritos", icon: "❤️", items: filtered.favs, onToggleFavorite: handleToggleFavorite, columns: columnLayout }),
            React.createElement(ItemGroup, { title: "Para tus Intereses", icon: "✨", items: filtered.rec, onToggleFavorite: handleToggleFavorite, columns: columnLayout }),
            React.createElement(ItemGroup, { title: `Cerca de ${user?.location?.city || 'ti'}`, icon: "📍", items: filtered.near, onToggleFavorite: handleToggleFavorite, columns: columnLayout }),
            React.createElement(ItemGroup, { title: "Más Visitados", icon: "🔥", items: filtered.popular, onToggleFavorite: handleToggleFavorite, columns: columnLayout }),
            React.createElement(ItemGroup, { title: "Más para explorar", icon: "🌍", items: filtered.explore, onToggleFavorite: handleToggleFavorite, columns: columnLayout })
          );
      }

      const activeItems = viewMode === 'cerca' ? filtered.near 
                        : viewMode === 'favoritos' ? filtered.favs 
                        : filtered.explore;
      
      const titles = { cerca: `Todo cerca de ${user?.location?.city || 'ti'}`, favoritos: "Tus Preferidos", recientes: "Nuevas Publicaciones" };
      const icons = { cerca: "📍", favoritos: "❤️", recientes: "🕒" };

      if (activeItems.length === 0) {
          return React.createElement(EmptyState, {
              icon: ICONS.swap,
              title: "No hay resultados",
              message: "Parece que no hay nada por aquí con estos filtros.",
              actionButton: React.createElement(Button, { onClick: () => setViewMode('landing'), children: "Volver a Descubrir" })
          });
      }

      return React.createElement(ItemGroup, { title: titles[viewMode], icon: icons[viewMode], items: activeItems, onToggleFavorite: handleToggleFavorite, columns: columnLayout });
  };

  return React.createElement("div", { className: "pb-20" },
    React.createElement("div", { className: "mb-8 flex flex-col md:flex-row gap-3 justify-between md:items-center" },
      React.createElement("div", { className: "flex items-center gap-2 w-full md:w-auto" },
        React.createElement(ViewSelector, { mode: viewMode, setMode: setViewMode }),
        React.createElement("div", { className: "flex-grow md:w-72 lg:w-96" },
            React.createElement("input", {
                type: "search",
                className: "w-full p-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 shadow-sm",
                placeholder: searchType === 'articles' ? "Buscar artículos..." : "Buscar por ciudad o provincia...",
                value: searchQuery,
                onChange: (e) => setSearchQuery(e.target.value)
            })
        ),
        React.createElement("button", {
            onClick: () => setSearchType(t => t === 'articles' ? 'location' : 'articles'),
            title: searchType === 'location' ? "Buscar por nombre" : "Buscar por ubicación",
            className: `p-2.5 rounded-xl border transition-colors ${searchType === 'location' ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-gray-200 text-gray-400 hover:text-gray-600'}`
        }, searchType === 'location' ? '📍' : '🔍')
      )
    ),

    renderCurrentView(),
    
    data.exploreItems.length < data.totalExploreItems && viewMode !== 'landing' && React.createElement("div", { className: "flex justify-center mt-8" },
        React.createElement(Button, { onClick: () => fetchItems(page + 1, true), children: "Cargar más contenido" })
    ),
    
    React.createElement(Link, {
        to: "/add-item",
        className: `fixed bottom-24 right-6 bg-gradient-to-r ${theme.bg} text-white rounded-full p-4 shadow-xl hover:scale-110 transition-transform z-40 border-4 border-white dark:border-gray-900`
    },
      React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-8 w-8", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth:"3" },
        React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M12 4v16m8-8H4" })
      )
    )
  );
};

export default HomePage;
