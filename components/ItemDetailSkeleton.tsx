import React from 'react';

const ItemDetailSkeleton = () => {
  return React.createElement("div", { className: "bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 animate-pulse" },
    React.createElement("div", { className: "h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-4" }),
    React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-8" },
      React.createElement("div", null,
        React.createElement("div", { className: "mb-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-full h-96" }),
        React.createElement("div", { className: "flex space-x-2" },
          React.createElement("div", { className: "w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-md" }),
          React.createElement("div", { className: "w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-md" }),
          React.createElement("div", { className: "w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-md" })
        )
      ),
      React.createElement("div", { className: "flex flex-col" },
        React.createElement("div", { className: "h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded-full mb-2" }),
        React.createElement("div", { className: "flex justify-between items-start gap-4 mb-4" },
            React.createElement("div", { className: "h-10 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" }),
            React.createElement("div", { className: "h-12 w-24 bg-gray-200 dark:bg-gray-700 rounded-full" })
        ),
        React.createElement("div", { className: "space-y-3 flex-grow" },
          React.createElement("div", { className: "h-4 bg-gray-200 dark:bg-gray-700 rounded" }),
          React.createElement("div", { className: "h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" }),
          React.createElement("div", { className: "h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" })
        ),
        React.createElement("div", { className: "border-t border-gray-200 dark:border-gray-700 pt-4 mt-6" },
          React.createElement("div", { className: "h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded mb-2" }),
          React.createElement("div", { className: "h-4 w-1/3 bg-gray-200 dark:bg-gray-700 rounded" })
        ),
        React.createElement("div", { className: "mt-6" },
          React.createElement("div", { className: "h-12 w-full bg-gray-200 dark:bg-gray-700 rounded-lg" })
        )
      )
    )
  );
};

export default ItemDetailSkeleton;
