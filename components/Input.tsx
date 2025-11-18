
import React from 'react';
import { useColorTheme } from '../hooks/useColorTheme.tsx';

// Fix: Make icon and onIconClick props optional to resolve type errors in multiple components.
const Input = ({ label, id, icon, onIconClick, ...props }: {label?: string, id: string, icon?: React.ReactNode, onIconClick?: (e: React.MouseEvent<HTMLButtonElement>) => void, [key: string]: any}) => {
  const { theme } = useColorTheme();
  return React.createElement("div", null,
    React.createElement("label", { htmlFor: id, className: "block text-sm font-medium text-gray-700 dark:text-gray-300" },
      label
    ),
    React.createElement("div", { className: "mt-1 relative" },
      React.createElement("input", {
        id: id,
        className: `appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 ${theme.focus} focus:${theme.border} sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${icon ? 'pr-10' : ''}`,
        ...props
      }),
      icon && (
          React.createElement("button", { type: "button", onClick: onIconClick, className: "absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-300", "aria-label": "Toggle password visibility" },
            icon
          )
      )
    )
  );
};

export default Input;
