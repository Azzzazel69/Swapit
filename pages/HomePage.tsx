
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
import AdBanner from '../components/AdBanner.tsx';
import { ICONS } from '../constants.tsx';

interface ItemGroupProps {
    title: string;
    icon: string;
    items: any[];
    onToggleFavorite: (id: string) => void;
    columns?: number | 'auto';
    id?: string;
    showAds?: boolean;
}

const ItemGroup = ({ title, icon, items, onToggleFavorite, columns = 2, id = "", showAds = false }: ItemGroupProps) => {
    const { theme } = useColorTheme();
    if (!items || items.length === 0) return null;
    const gridLayoutClasses = { 
        'auto': 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
        1: 'grid-cols-1', 
        2: 'grid-cols-2', 
        3: 'grid-cols-3', 
        4: 'grid-cols-4' 
    };

    return (
        React.createElement("div", { id: id, className: "mb-12 animate-fade-in-up scroll-mt-20" },
            React.createElement("h2", { className: `text-xl font-black text-gray-900 dark:text-white mb-4 flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm border-l-4 ${theme.border}` }, 
                React.createElement("span", { className: "text-2xl" }, icon), 
                title
            ),
            React.createElement("div", { className: `grid ${gridLayoutClasses[columns] || 'grid-cols-2'} gap-4 md:gap-6 transition-all duration-500` },
                items.map((item, index) => (
                    React.createElement(React.Fragment, { key: item.id },
                        React.createElement(ItemCard, { item: item, onToggleFavorite: onToggleFavorite, columns: columns }),
                        showAds && index > 0 && (index + 1) % 6 === 0 && (
                            React.createElement(AdBanner, { adSlot: `ad-slot-${index}` })
                        )
                    )
                ))
            )
        )
    );
};

const ViewSelectorCompact = ({ mode, setMode }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const { theme } = useColorTheme();
    
    const options = [
        { id: 'landing', label: 'Descubrir todo', icon: '✨' },
        { id: 'cerca', label: 'Cerca de mí', icon: '📍' },
        { id: 'favoritos', label: 'Mis Favoritos', icon: '❤️' },
        { id: 'recientes', label: 'Novedades', icon: '🕒' }
    ];

    useEffect(() => {
        const clickOut = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false); };
        document.addEventListener('mousedown', clickOut);
        return () => document.removeEventListener('mousedown', clickOut);
    }, []);

    return (
        React.createElement("div", { className: "relative", ref: dropdownRef },
            React.createElement("button", { 
                onClick: () => setIsOpen(!isOpen),
                title: "Cambiar vista",
                className: `flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:scale-105 active:scale-95 transition-all`
            }, 
                React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", className: `h-5 w-5 ${theme.textColor}`, fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: "2.5" },
                    React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" })
                )
            ),
            isOpen && React.createElement("div", { className: "absolute left-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-2xl z-50 border border-gray-100 dark:border-gray-700 overflow-hidden animate-fade-in-up" },
                options.map(opt => (
                    React.createElement("button", {
                        key: opt.id,
                        onClick: () => { setMode(opt.id); setIsOpen(false); },
                        className: `w-full flex items-center gap-3 px-4 py-3 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${mode === opt.id ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600' : 'text-gray-700 dark:text-gray-300'}`
                    }, 
                        React.createElement("span", { className: "text-lg" }, opt.icon),
                        React.createElement("span", { className: "font-black" }, opt.label)
                    )
                ))
            )
        )
    );
};

const GridIconContent = ({ columns }: { columns: number | 'auto' }) => {
    if (columns === 1) return React.createElement("rect", { x: "3", y: "3", width: "18", height: "18", rx: "1", strokeWidth: "2" });
    if (columns === 2) return React.createElement(React.Fragment, null, 
        React.createElement("rect", { x: "3", y: "3", width: "8", height: "18", rx: "1", strokeWidth: "2" }),
        React.createElement("rect", { x: "13", y: "3", width: "8", height: "18", rx: "1", strokeWidth: "2" })
    );
    if (columns === 3) return React.createElement(React.Fragment, null,
        React.createElement("rect", { x: "2", y: "3", width: "5", height: "18", rx: "1", strokeWidth: "2" }),
        React.createElement("rect", { x: "9.5", y: "3", width: "5", height: "18", rx: "1", strokeWidth: "2" }),
        React.createElement("rect", { x: "17", y: "3", width: "5", height: "18", rx: "1", strokeWidth: "2" })
    );
    if (columns === 4) return React.createElement(React.Fragment, null,
        React.createElement("rect", { x: "2", y: "3", width: "3.5", height: "18", rx: "1", strokeWidth: "2" }),
        React.createElement("rect", { x: "7", y: "3", width: "3.5", height: "18", rx: "1", strokeWidth: "2" }),
        React.createElement("rect", { x: "12", y: "3", width: "3.5", height: "18", rx: "1", strokeWidth: "2" }),
        React.createElement("rect", { x: "17", y: "3", width: "3.5", height: "18", rx: "1", strokeWidth: "2" })
    );
    return React.createElement(React.Fragment, null,
        React.createElement("rect", { x: "3", y: "3", width: "8", height: "8", rx: "1", strokeWidth: "2" }),
        React.createElement("rect", { x: "13", y: "3", width: "8", height: "8", rx: "1", strokeWidth: "2" }),
        React.createElement("rect", { x: "3", y: "13", width: "8", height: "8", rx: "1", strokeWidth: "2" }),
        React.createElement("rect", { x: "13", y: "13", width: "8", height: "8", rx: "1", strokeWidth: "2" })
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
  const [columnLayout, setColumnLayout] = useState<number | 'auto'>('auto');
  const [data, setData] = useState({ exploreItems: [], directMatches: [], recommended: [], nearItems: [], favoriteItems: [], popularItems: [], totalExploreItems: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('articles'); 

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await api.getHomePageData(user?.id);
      setData(res);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchItems(); }, [user, viewMode]);

  const handleToggleFavorite = async (itemId) => {
    try {
        const res = await api.toggleFavorite(itemId);
        if (!res || !res.item) return;
        const updater = (prev) => prev.map(i => i.id === itemId ? { ...i, ...res.item } : i);
        setData(d => {
            let newFavs = [...d.favoriteItems];
            if (res.isFavorite) {
                if (!newFavs.some(i => i.id === itemId)) newFavs.push(res.item);
            } else {
                newFavs = newFavs.filter(i => i.id !== itemId);
            }
            return { 
                ...d, 
                exploreItems: updater(d.exploreItems), 
                directMatches: updater(d.directMatches), 
                recommended: updater(d.recommended), 
                favoriteItems: newFavs,
                nearItems: updater(d.nearItems),
                popularItems: updater(d.popularItems)
            };
        });
    } catch (e) { console.error(e); }
  };

  const toggleColumns = () => {
      setColumnLayout(prev => {
          if (prev === 'auto') return 1;
          if (typeof prev === 'number' && prev >= 4) return 'auto';
          return (prev as number) + 1;
      });
  };

  const filtered = useMemo(() => ({
      matches: applySearch(data.directMatches, searchQuery, searchType),
      rec: applySearch(data.recommended, searchQuery, searchType),
      near: applySearch(data.nearItems, searchQuery, searchType),
      favs: applySearch(data.favoriteItems, searchQuery, searchType),
      popular: applySearch(data.popularItems, searchQuery, searchType),
      explore: applySearch(data.exploreItems, searchQuery, searchType)
  }), [data, searchQuery, searchType]);

  if (loading) {
    return (
        React.createElement("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4" }, 
            [...Array(8)].map((_, i) => React.createElement(ItemCardSkeleton, { key: i }))
        )
    );
  }

  const renderCurrentView = () => {
      if (viewMode === 'landing') {
          return React.createElement(React.Fragment, null,
            React.createElement(ItemGroup, { title: "Matches Directos", icon: "⚡️", items: filtered.matches, onToggleFavorite: handleToggleFavorite, columns: columnLayout, showAds: true }),
            React.createElement(ItemGroup, { title: "Tus Favoritos", icon: "❤️", items: filtered.favs, onToggleFavorite: handleToggleFavorite, columns: columnLayout }),
            React.createElement(ItemGroup, { title: "Para tus Intereses", icon: "✨", items: filtered.rec, onToggleFavorite: handleToggleFavorite, columns: columnLayout, showAds: true }),
            React.createElement(ItemGroup, { title: `Cerca de ${user?.location?.city || 'ti'}`, icon: "📍", items: filtered.near, onToggleFavorite: handleToggleFavorite, columns: columnLayout, showAds: true }),
            React.createElement(ItemGroup, { title: "Más Visitados", icon: "🔥", items: filtered.popular, onToggleFavorite: handleToggleFavorite, columns: columnLayout }),
            React.createElement(ItemGroup, { title: "Novedades", icon: "🌍", items: filtered.explore, onToggleFavorite: handleToggleFavorite, columns: columnLayout, showAds: true })
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
              title: "No hay artículos disponibles",
              message: "Parece que no hay nada por aquí todavía. Prueba a recargar o vuelve más tarde.",
              actionButton: React.createElement("div", { className: "flex flex-col gap-3" },
                React.createElement(Button, { onClick: () => fetchItems(), children: "Recargar contenido" }),
                React.createElement(Button, { variant: "outline", onClick: () => setViewMode('landing'), children: "Volver a Descubrir" })
              )
          });
      }

      return React.createElement(ItemGroup, { title: titles[viewMode as keyof typeof titles], icon: icons[viewMode as keyof typeof icons], items: activeItems, onToggleFavorite: handleToggleFavorite, columns: columnLayout, showAds: true });
  };

    return React.createElement("div", { className: "pb-32 w-full" },
      React.createElement("div", { className: "mb-6 flex flex-col gap-4 w-full" },
        React.createElement("div", { className: "flex items-center gap-2 w-full" },
          // Botón Filtros
          React.createElement("button", {
              className: "flex items-center justify-center w-12 h-12 min-w-[3rem] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm hover:scale-105 transition-all text-gray-500",
              onClick: () => {} // Futuro
          },
              ICONS.filter
          ),
          
          // Buscador
          React.createElement("div", { className: "relative flex-grow h-12" },
              React.createElement("input", {
                  type: "search",
                  className: "w-full h-full pl-4 pr-12 text-base bg-gray-100/80 dark:bg-gray-800 border-none rounded-2xl focus:ring-2 focus:ring-orange-500 shadow-sm transition-all dark:text-white placeholder-gray-400",
                  placeholder: "Buscar artículos...",
                  value: searchQuery,
                  onChange: (e) => setSearchQuery(e.target.value)
              }),
              React.createElement("div", { className: "absolute right-3 top-0 h-full flex items-center pointer-events-none text-gray-400" },
                  ICONS.search
              )
          ),
          
          // Botón Columnas
          React.createElement("button", {
              className: "flex flex-col items-center justify-center w-12 h-12 min-w-[3rem] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm hover:scale-105 transition-all text-gray-500",
              onClick: toggleColumns,
              title: "Cambiar vista de grid"
          },
              React.createElement("svg", { width: "22", height: "22", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", className: "transition-all" },
                  React.createElement(GridIconContent, { columns: columnLayout })
              )
          )
        )
      ),
  
      renderCurrentView()
      
      /* Floating Action Dock removed from here and moved to App.tsx */
    );
  };

export default HomePage;
