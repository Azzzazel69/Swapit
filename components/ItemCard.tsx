
import React from 'react';
import { Link } from 'react-router-dom';
import { useColorTheme } from '../hooks/useColorTheme.tsx';
import { ItemCondition } from '../types.ts';

const formatTimeAgo = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Ahora';
    if (diffInSeconds < 3600) return `Hace ${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `Hace ${Math.floor(diffInSeconds / 3600)}h`;
    return `Hace ${Math.floor(diffInSeconds / 86400)}d`;
};

const ItemCard = ({ item, onToggleFavorite, columns = 2 }) => {
  const { theme } = useColorTheme();
  const isSmall = columns > 2;

  const conditionClasses = {
    [ItemCondition.New]: 'bg-green-100 text-green-800',
    [ItemCondition.LikeNew]: 'bg-blue-100 text-blue-800',
    [ItemCondition.Good]: 'bg-yellow-100 text-yellow-800',
    [ItemCondition.Acceptable]: 'bg-gray-200 text-gray-800',
  };

  return React.createElement("div", { 
      className: `group bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transition-all hover:-translate-y-1 hover:shadow-2xl border border-gray-100 dark:border-gray-700` 
    },
    React.createElement(Link, { to: `/item/${item.id}`, className: "block" },
      React.createElement("div", { className: "relative aspect-square overflow-hidden" },
        item.isMatch && React.createElement("div", { className: "absolute top-2 left-2 z-10 bg-orange-500 text-white text-[10px] font-black px-2 py-1 rounded-lg animate-pulse shadow-lg" }, "⚡ MATCH"),
        React.createElement("img", { className: "w-full h-full object-cover transition-transform group-hover:scale-110", src: item.imageUrls[0], alt: item.title }),
        React.createElement("div", { className: `absolute bottom-2 right-2 text-[9px] font-black px-2 py-1 rounded-md shadow-sm ${conditionClasses[item.condition]}` }, item.condition)
      ),
      React.createElement("div", { className: "p-3" },
        React.createElement("div", { className: "flex justify-between items-start mb-1 gap-2" },
            React.createElement("h3", { className: `font-bold text-gray-900 dark:text-white truncate flex-grow ${isSmall ? 'text-xs' : 'text-sm'}` }, item.title),
            onToggleFavorite && React.createElement("button", { 
                onClick: (e) => { e.preventDefault(); e.stopPropagation(); onToggleFavorite(item.id); },
                className: "text-xs flex-shrink-0"
            }, item.isFavorited ? '❤️' : '🤍')
        ),
        React.createElement("div", { className: "flex justify-between items-center mt-1" },
            React.createElement("div", { className: "flex items-center gap-1 text-[9px] font-bold text-gray-400" },
                React.createElement("span", null, "📍"),
                React.createElement("span", { className: "truncate max-w-[70px]" }, item.ownerLocation?.city || 'España')
            ),
            React.createElement("span", { className: "text-[9px] font-medium text-gray-400" }, formatTimeAgo(item.createdAt))
        )
      )
    )
  );
};

export default ItemCard;
