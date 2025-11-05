
import React from 'react';

const EmptyState = ({ icon, title, message, actionButton }) => {
    return (
        React.createElement("div", { className: "text-center py-12 px-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700" },
            React.createElement("div", { className: "flex justify-center items-center mb-4 text-gray-400 dark:text-gray-500" },
                React.cloneElement(icon, { className: "h-16 w-16" })
            ),
            React.createElement("h3", { className: "text-xl font-semibold text-gray-900 dark:text-white mb-2" }, title),
            React.createElement("p", { className: "text-gray-500 dark:text-gray-400 mb-6" }, message),
            actionButton && React.createElement("div", null, actionButton)
        )
    );
};

export default EmptyState;
