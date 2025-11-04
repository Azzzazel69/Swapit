
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
      React.createElement("svg", { 
        className: `animate-spin ${sizeClasses[size]} ${theme.textColor}`, 
        xmlns: "http://www.w3.org/2000/svg", 
        viewBox: "0 0 24 24", 
        fill: "none", 
        stroke: "currentColor", 
        strokeWidth: "2.5", 
        strokeLinecap: "round", 
        strokeLinejoin: "round"
      },
        React.createElement("polyline", { points: "23 4 23 10 17 10" }),
        React.createElement("polyline", { points: "1 20 1 14 7 14" }),
        React.createElement("path", { d: "M20.49 9A9 9 0 0 0 5.64 5.64" }),
        React.createElement("path", { d: "M3.51 15A9 9 0 0 0 18.36 18.36" })
      )
    )
  );
};

export default SwapSpinner;