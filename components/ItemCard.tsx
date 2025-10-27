import React from 'react';
import { Link } from 'react-router-dom';
import { useColorTheme } from '../hooks/useColorTheme.js';

const ItemCard = ({ item, isOwnItem = false }) => {
  const { theme } = useColorTheme();
  return React.createElement(Link, { to: `/item/${item.id}`, className: "block bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-1 transition-transform duration-300 group" },
    React.createElement("div", { className: "relative" },
      React.createElement("img", { className: "w-full h-56 object-cover object-center", src: item.imageUrls[0], alt: item.title }),
      React.createElement("div", { className: `absolute top-2 left-2 bg-gradient-to-r ${theme.bg} text-white text-xs font-bold px-2 py-1 rounded-full` }, item.category),
      item.imageUrls.length > 1 && (
        React.createElement("div", { className: "absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1" },
          React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-4 w-4", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" }, React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" })),
          React.createElement("span", null, item.imageUrls.length)
        )
      )
    ),
    React.createElement("div", { className: "p-6" },
      React.createElement("h2", { className: `text-xl font-bold mb-2 text-gray-900 dark:text-white truncate group-hover:${theme.textColor} transition-colors` }, item.title),
      React.createElement("p", { className: "text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3 h-16" }, item.description),
      React.createElement("div", { className: "flex items-center justify-between mt-auto" },
        React.createElement("div", { className: "text-sm text-gray-500 dark:text-gray-400" },
          React.createElement("p", null, "Propietario: ", React.createElement("strong", null, isOwnItem ? 'Tú' : item.ownerName))
        )
      )
    )
  );
};

export default ItemCard;
