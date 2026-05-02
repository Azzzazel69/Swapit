
import React from 'react';
import { Link } from 'react-router-dom';
import { useColorTheme } from '../hooks/useColorTheme.tsx';
import { ItemCondition } from '../types.ts';

const formatTimeAgo = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Ahora';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    return `${Math.floor(diffInSeconds / 86400)}d`;
};

const ItemCard = ({ item, onToggleFavorite, onDelete, isOwnItem = false, columns = 2, deletingItemId }: { item: any, onToggleFavorite?: (id: string) => void, onDelete?: (id: string) => void, isOwnItem?: boolean, columns?: number, deletingItemId?: string | null }) => {
  const { theme } = useColorTheme();
  
  // Definimos niveles de densidad lógica para clases condicionales de JS
  const isCompact = columns === 3;
  const isMini = columns >= 4;
  const isHighDensity = columns >= 3;

  const conditionClasses = {
    [ItemCondition.New]: 'bg-green-500',
    [ItemCondition.LikeNew]: 'bg-blue-500',
    [ItemCondition.Good]: 'bg-yellow-500',
    [ItemCondition.Acceptable]: 'bg-gray-400',
  };

  const conditionLabels = {
    [ItemCondition.New]: 'Nuevo',
    [ItemCondition.LikeNew]: 'Casi nuevo',
    [ItemCondition.Good]: 'Buen estado',
    [ItemCondition.Acceptable]: 'Aceptable',
  };

  return React.createElement("div", { 
      className: `group bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg border border-gray-100 dark:border-gray-700 flex flex-col h-full relative` 
    },
    isOwnItem && onDelete && React.createElement("button" as any, {
        onClick: (e: any) => { e.preventDefault(); e.stopPropagation(); onDelete(item.id); },
        className: "absolute top-2 right-2 z-20 p-1.5 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors"
    }, "✕"),
    React.createElement(Link, { to: `/item/${item.id}`, className: "flex flex-col h-full" },
      // Contenedor de Imagen
      React.createElement("div", { className: "relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-900" },
        // STATUS OVERLAYS
        item.status === 'RESERVED' && React.createElement("div", { 
            className: "absolute inset-0 z-20 bg-black bg-opacity-40 flex items-center justify-center p-2 text-center backdrop-blur-sm" 
        }, 
            React.createElement("span", { className: "bg-yellow-500 text-white font-black px-2 py-1 md:px-3 text-[10px] md:text-sm rounded-md shadow-lg transform -rotate-12 outline outline-2 outline-white" }, "RESERVADO") 
        ),
        item.status === 'EXCHANGED' && React.createElement("div", { 
            className: "absolute inset-0 z-20 bg-black bg-opacity-60 flex items-center justify-center p-2 text-center backdrop-blur-sm" 
        }, 
            React.createElement("span", { className: "bg-indigo-600 text-white font-black px-2 py-1 md:px-3 text-[10px] md:text-sm rounded-md shadow-lg transform -rotate-12 outline outline-2 outline-white" }, "INTERCAMBIADO") 
        ),

        item.isMatch && React.createElement("div", { 
            className: `absolute top-1 left-1 z-10 bg-orange-500 text-white font-black rounded-md shadow-lg flex items-center justify-center animate-pulse
            ${isMini ? 'w-5 h-5 text-[8px] md:w-auto md:h-auto md:px-2 md:py-1 md:text-xs' : 'px-1.5 py-0.5 text-[9px] md:text-xs md:px-2 md:py-1'}` 
        }, React.createElement("span", { className: isMini ? "md:inline" : "inline" }, "⚡"), React.createElement("span", { className: isMini ? "hidden md:inline ml-1" : "inline ml-1" }, "MATCH")),
        
        React.createElement("img", { className: "w-full h-full object-cover transition-transform duration-500 group-hover:scale-110", src: item.imageUrls[0], alt: item.title }),
        
        // Badge de Estado Inteligente (Texto en PC, Punto en Móvil 4-col)
        React.createElement("div", { 
            className: `absolute bottom-1.5 right-1.5 font-black text-white rounded-lg shadow-md flex items-center gap-1 transition-all
            ${isMini ? 'p-1 md:px-2 md:py-1' : 'px-2 py-1'} 
            ${isMini ? 'text-[0px] md:text-[10px]' : 'text-[9px] md:text-[11px]'} 
            ${conditionClasses[item.condition]}` 
        }, 
            React.createElement("span", { className: isMini ? "hidden md:inline" : "inline" }, conditionLabels[item.condition]),
            isMini && React.createElement("div", { className: "w-2 h-2 rounded-full bg-white md:hidden" })
        )
      ),

      // Contenido de la Tarjeta
      React.createElement("div", { className: `${isMini ? 'p-1.5 md:p-4' : 'p-3 md:p-5'} flex flex-col flex-grow` },
        // Fila de Título y Favorito
        React.createElement("div", { className: "flex justify-between items-start gap-1 mb-2" },
            React.createElement("h3", { 
                className: `font-bold text-gray-900 dark:text-white truncate leading-tight transition-all
                ${isMini ? 'text-[10px] md:text-sm lg:text-base' : isCompact ? 'text-xs md:text-base lg:text-lg' : 'text-sm md:text-lg lg:text-xl'}` 
            }, item.title),
            onToggleFavorite && React.createElement("button" as any, { 
                onClick: (e: any) => { e.preventDefault(); e.stopPropagation(); onToggleFavorite(item.id); },
                className: `flex-shrink-0 transition-transform active:scale-125 ${isMini ? 'text-[10px] md:text-sm' : 'text-xs md:text-base'}`
            }, item.isFavorited ? '❤️' : '🤍')
        ),

        // BUSCO (NUEVO)
        item.wishedItem && !isMini && React.createElement("div", { className: "text-xs md:text-sm text-gray-800 dark:text-gray-200 mb-2 truncate flex flex-col" }, 
            React.createElement("span", { className: "text-gray-500 text-[10px] md:text-sm" }, "Busca:"),
            React.createElement("span", { className: "text-orange-500 font-bold" }, item.wishedItem)
        ),

        // Información Secundaria
        React.createElement("div", { className: `${isMini ? 'hidden md:flex' : 'flex'} justify-between items-center mt-auto` },
            React.createElement("div", { className: `flex items-center gap-1 font-bold text-gray-400 ${isCompact ? 'text-[8px] md:text-xs' : 'text-[9px] md:text-sm'}` },
                React.createElement("span", { className: "md:text-sm" }, "📍"),
                React.createElement("span", { className: "truncate max-w-[60px] md:max-w-none" }, item.ownerLocation?.city || 'ES')
            ),
            React.createElement("span", { className: `font-medium text-gray-400 ${isCompact ? 'text-[8px] md:text-xs' : 'text-[9px] md:text-sm'}` }, formatTimeAgo(item.createdAt))
        ),

        // Fila del Propietario (Solo se muestra en 1 o 2 columnas en móvil, o siempre en escritorio si no es 4 col)
        React.createElement("div", { className: `${isHighDensity ? 'hidden lg:flex' : 'flex'} items-center gap-2 mt-2 pt-3 border-t border-gray-100 dark:border-gray-700/50` },
            React.createElement("img", { src: item.ownerAvatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + (item.ownerId || 'default'), className: "w-5 h-5 md:w-6 md:h-6 rounded-full object-cover shadow-sm" }),
            React.createElement("span", { className: "text-[10px] md:text-xs font-bold text-gray-500 dark:text-gray-400 truncate" }, item.ownerName || 'Usuario'),
            (item.ownerRating || 0) > 0 && React.createElement("div", { className: "ml-auto flex items-center gap-1 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded-md" },
                React.createElement("span", { className: "text-[8px] md:text-[10px]" }, "⭐"),
                React.createElement("span", { className: "text-[9px] md:text-[11px] font-black text-gray-700 dark:text-gray-300" }, item.ownerRating)
            )
        )
      )
    )
  );
};

export default ItemCard;
