
import React from 'react';
import { Link } from 'react-router-dom';
import { useColorTheme } from '../hooks/useColorTheme.tsx';
import { ICONS } from '../constants.tsx';
import SwapSpinner from './SwapSpinner.tsx';

const ItemCard = ({ item, isOwnItem = false, onDelete, deletingItemId, onToggleFavorite }) => {
  const { theme } = useColorTheme();
  const isSwapped = item.status === 'EXCHANGED';
  const isReserved = item.status === 'RESERVED';
  const isBeingDeleted = deletingItemId === item.id;

  return React.createElement("div", { 
      className: `relative bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-1 transition-transform duration-300 group ${isSwapped || isReserved ? 'opacity-60' : ''}` 
    },
    isBeingDeleted && (
        React.createElement("div", { className: "absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20" },
            React.createElement(SwapSpinner, { size: 'md-small' })
        )
    ),
    isOwnItem && !isSwapped && !isReserved && onDelete && (
        React.createElement("button", {
            onClick: (e) => { e.preventDefault(); e.stopPropagation(); onDelete(item.id); },
            className: "absolute top-2 right-2 z-10 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50",
            title: "Eliminar artículo",
            disabled: isBeingDeleted
        },
            React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-4 w-4", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" }, React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" }))
        )
    ),
    React.createElement(Link, { to: `/item/${item.id}`, className: "block" },
      React.createElement("div", { className: "relative" },
        item.isMatch && (
          React.createElement("div", { className: "absolute top-1.5 left-1.5 z-10 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg flex items-center gap-1" },
            "⚡️ ¡MATCH!"
          )
        ),
        React.createElement("img", { className: "w-full aspect-square object-cover object-center", src: item.imageUrls[0], alt: item.title }),
        isSwapped && (
          React.createElement("div", { className: "absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center" },
              React.createElement("span", { className: "text-white text-2xl font-bold border-4 border-white px-4 py-2 rounded-lg transform -rotate-12" }, "SWAPPED!")
          )
        ),
         isReserved && (
          React.createElement("div", { className: "absolute inset-0 bg-yellow-600 bg-opacity-70 flex items-center justify-center" },
              React.createElement("span", { className: "text-white text-2xl font-bold border-4 border-white px-4 py-2 rounded-lg transform -rotate-12" }, "RESERVADO")
          )
        ),
        !isSwapped && !isReserved && React.createElement("div", { className: `absolute top-2 right-2 bg-gradient-to-r ${theme.bg} text-white text-xs font-bold px-2 py-1 rounded-full` }, item.category),
        item.imageUrls.length > 1 && (
          React.createElement("div", { className: "absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1" },
            React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-4 w-4", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" }, React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" })),
            React.createElement("span", null, item.imageUrls.length)
          )
        )
      ),
      React.createElement("div", { className: "p-4" },
        React.createElement("div", { className: "flex justify-between items-start gap-2" },
            React.createElement("h2", { className: `text-lg font-bold mb-1 truncate flex-grow transition-colors ${item.isFavorited ? 'text-red-500 dark:text-red-400' : `text-gray-900 dark:text-white group-hover:${theme.textColor}`}` }, item.title),
            !isOwnItem && onToggleFavorite && React.createElement("button", {
              onClick: (e) => { e.preventDefault(); e.stopPropagation(); onToggleFavorite(item.id); },
              className: "flex-shrink-0 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400",
              title: "Añadir a favoritos"
            },
              item.isFavorited ? React.createElement("span", { className: "text-red-500" }, React.cloneElement(ICONS.heartSolid, { className: "h-4 w-4" })) : React.cloneElement(ICONS.heart, { className: "h-4 w-4" }),
              React.createElement("span", { className: "font-bold" }, item.likes || 0)
            )
        ),
        React.createElement("p", { className: "text-gray-600 dark:text-gray-400 text-sm mb-2 line-clamp-2 h-10" }, item.description),
        
        item.wishedItem && (
            React.createElement("div", { className: "mt-2 pt-2 border-t border-gray-100 dark:border-gray-700" },
              React.createElement("h4", { className: "text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1" }, 
                React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-3 w-3", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor"}, React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M13 10V3L4 14h7v7l9-11h-7z" })),
                "Desea:"
              ),
              React.createElement("p", { className: "text-sm font-medium text-gray-800 dark:text-gray-200 truncate mt-1" }, item.wishedItem)
            )
        ),

        React.createElement("div", { className: "flex items-center justify-between mt-4" },
          React.createElement("div", { className: "text-sm text-gray-500 dark:text-gray-400" },
            React.createElement("p", null, "Propietario: ", React.createElement("strong", null, isOwnItem ? 'Tú' : item.ownerName))
          )
        )
      )
    )
  );
};

export default ItemCard;