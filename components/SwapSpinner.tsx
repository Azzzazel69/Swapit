import React from 'react';
import { useColorTheme } from '../hooks/useColorTheme.tsx';

const SwapSpinner = ({ size = 'md' }) => {
  const { theme } = useColorTheme();

  const sizeClasses = {
    sm: 'h-5 w-5',
    'md-small': 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  };

  return (
    React.createElement("div", { className: `relative ${sizeClasses[size]} flex items-center justify-center` },
      React.createElement("svg", { className: `absolute animate-spin-slower ${sizeClasses[size]} text-gray-300 dark:text-gray-600`, xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: "2" },
        React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M8 7h12m0 0l-4-4m4 4l-4 4" })
      ),
      React.createElement("svg", { className: `absolute animate-spin-slow ${sizeClasses[size]} ${theme.textColor}`, xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: "2" },
        React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M16 17H4m0 0l4 4m-4-4l4-4" })
      )
    )
  );
};

export default SwapSpinner;