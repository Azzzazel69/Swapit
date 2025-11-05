import React from 'react';

const ItemCardSkeleton = () => {
  return (
    React.createElement("div", { className: "bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden animate-pulse" },
      React.createElement("div", { className: "bg-gray-300 dark:bg-gray-700 w-full aspect-square" }),
      React.createElement("div", { className: "p-4" },
        React.createElement("div", { className: "h-5 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-3" }),
        React.createElement("div", { className: "h-3 bg-gray-300 dark:bg-gray-700 rounded w-full mb-2" }),
        React.createElement("div", { className: "h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/2 mb-4" }),
        React.createElement("div", { className: "pt-2 border-t border-gray-200 dark:border-gray-700" },
          React.createElement("div", { className: "h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/3" })
        )
      )
    )
  );
};

export default ItemCardSkeleton;
