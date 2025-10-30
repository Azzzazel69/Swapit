import React from 'react';
import { useColorTheme } from '../hooks/useColorTheme.js';

const Spinner = () => {
  const { theme } = useColorTheme();
  return React.createElement("div", { className: "flex justify-center items-center" },
    React.createElement("div", { className: `animate-spin rounded-full h-12 w-12 border-b-2 ${theme.border}` })
  );
};

export default Spinner;