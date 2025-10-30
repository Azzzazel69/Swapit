import React from 'react';
import { useColorTheme } from '../hooks/useColorTheme.js';

const Button = ({
  children,
  isLoading = false,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}) => {
  const { theme } = useColorTheme();
  const baseClasses = 'font-bold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-75 disabled:cursor-not-allowed transition-all duration-200 ease-in-out flex items-center justify-center relative';

  const sizeClasses = {
    sm: 'py-2 px-3 text-sm',
    md: 'py-2 px-4 text-base',
    lg: 'py-3 px-6 text-lg',
  };

  const variantClasses = {
    primary: `bg-gradient-to-r ${theme.bg} text-white ${theme.hoverBg} ${theme.focus}`,
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600',
    danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500',
  };

  return React.createElement("button",
    {
      className: `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`,
      disabled: isLoading || props.disabled,
      ...props
    },
    isLoading && React.createElement("span", { className: "absolute inset-0 flex items-center justify-center" },
      React.createElement("svg", { className: "animate-spin h-5 w-5 text-white", xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24" },
        React.createElement("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }),
        React.createElement("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })
      )
    ),
    React.createElement("span", { className: isLoading ? 'opacity-0' : 'opacity-100' },
      children
    )
  );
};

export default Button;