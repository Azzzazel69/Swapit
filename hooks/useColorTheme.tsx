





import React, { createContext, useContext, useMemo } from 'react';

const themes = [
  {
    name: 'Sunset',
    bg: 'from-orange-500 to-red-600',
    hoverBg: 'hover:from-orange-600 hover:to-red-700',
    focus: 'focus:ring-orange-500',
    border: 'border-orange-500',
    textColor: 'text-orange-500',
    hoverTextColor: 'hover:text-orange-600',
    lightBg: 'bg-orange-100 dark:bg-orange-900/50',
    darkText: 'text-orange-800 dark:text-orange-200',
    textGradient: 'text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600'
  },
  {
    name: 'Ocean',
    bg: 'from-green-400 to-blue-500',
    hoverBg: 'hover:from-green-500 hover:to-blue-600',
    focus: 'focus:ring-green-500',
    border: 'border-green-500',
    textColor: 'text-green-500',
    hoverTextColor: 'hover:text-green-600',
    lightBg: 'bg-green-100 dark:bg-green-900/50',
    darkText: 'text-green-800 dark:text-green-200',
    textGradient: 'text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500'
  },
  {
    name: 'Grape',
    bg: 'from-purple-500 to-pink-500',
    hoverBg: 'hover:from-purple-600 hover:to-pink-600',
    focus: 'focus:ring-purple-500',
    border: 'border-purple-500',
    textColor: 'text-purple-500',
    hoverTextColor: 'hover:text-purple-600',
    lightBg: 'bg-purple-100 dark:bg-purple-900/50',
    darkText: 'text-purple-800 dark:text-purple-200',
    textGradient: 'text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500'
  },
  {
    name: 'Lime',
    bg: 'from-lime-400 to-green-500',
    hoverBg: 'hover:from-lime-500 hover:to-green-600',
    focus: 'focus:ring-lime-500',
    border: 'border-lime-500',
    textColor: 'text-lime-500',
    hoverTextColor: 'hover:text-lime-600',
    lightBg: 'bg-lime-100 dark:bg-lime-900/50',
    darkText: 'text-lime-800 dark:text-lime-200',
    textGradient: 'text-transparent bg-clip-text bg-gradient-to-r from-lime-400 to-green-500'
  },
   {
    name: 'Sky',
    bg: 'from-sky-400 to-cyan-400',
    hoverBg: 'hover:from-sky-500 hover:to-cyan-500',
    focus: 'focus:ring-sky-500',
    border: 'border-sky-500',
    textColor: 'text-sky-500',
    hoverTextColor: 'hover:text-sky-600',
    lightBg: 'bg-sky-100 dark:bg-sky-900/50',
    darkText: 'text-sky-800 dark:text-sky-200',
    textGradient: 'text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-400'
  },
];

const ColorThemeContext = createContext(undefined);

export const ColorThemeProvider = ({ children }) => {
  const theme = useMemo(() => themes[Math.floor(Math.random() * themes.length)], []);

  return React.createElement(ColorThemeContext.Provider, { value: { theme } },
      children
  );
};

export const useColorTheme = () => {
  const context = useContext(ColorThemeContext);
  if (context === undefined) {
    throw new Error('useColorTheme must be used within a ColorThemeProvider');
  }
  return context;
};