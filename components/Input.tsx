import React from 'react';
import { useColorTheme } from '../hooks/useColorTheme.js';

const Input = ({ label, id, ...props }) => {
  const { theme } = useColorTheme();
  return React.createElement("div", null,
    React.createElement("label", { htmlFor: id, className: "block text-sm font-medium text-gray-700 dark:text-gray-300" },
      label
    ),
    React.createElement("div", { className: "mt-1" },
      React.createElement("input", {
        id: id,
        className: `appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 ${theme.focus} focus:${theme.border} sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`,
        ...props
      })
    )
  );
};

export default Input;
