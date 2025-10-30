



import React, { useState, useEffect, useRef } from 'react';
import { useColorTheme } from '../hooks/useColorTheme.js';

const AutocompleteInput = ({ label, id, value, onChange, suggestions, maxSuggestions = 10, ...props }) => {
  const { theme } = useColorTheme();
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [wrapperRef]);
  
  const filterAndShowSuggestions = (userInput) => {
      const newFilteredSuggestions = userInput 
        ? suggestions.filter(suggestion => suggestion.toLowerCase().startsWith(userInput.toLowerCase()))
        : suggestions;
        
      setFilteredSuggestions(newFilteredSuggestions.slice(0, maxSuggestions));
      setShowSuggestions(true);
  };

  const handleChange = (e) => {
    const userInput = e.target.value;
    onChange(userInput);
    filterAndShowSuggestions(userInput);
  };
  
  const handleFocus = () => {
      filterAndShowSuggestions(value);
  };

  const onSuggestionClick = (suggestion) => {
    onChange(suggestion);
    setFilteredSuggestions([]);
    setShowSuggestions(false);
  };

  return React.createElement("div", { className: "relative", ref: wrapperRef },
    React.createElement("label", { htmlFor: id, className: "block text-sm font-medium text-gray-700 dark:text-gray-300" },
      label
    ),
    React.createElement("div", { className: "mt-1" },
      React.createElement("input", {
        id: id,
        value: value,
        onChange: handleChange,
        onFocus: handleFocus,
        autoComplete: "off",
        className: `appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 ${theme.focus} focus:${theme.border} sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`,
        ...props
      })
    ),
    showSuggestions && filteredSuggestions.length > 0 && (
      React.createElement("ul", { className: "absolute z-10 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md mt-1 max-h-60 overflow-auto shadow-lg" },
        filteredSuggestions.map((suggestion) => 
          React.createElement("li", {
            key: suggestion,
            onClick: () => onSuggestionClick(suggestion),
            className: "cursor-pointer select-none relative py-2 px-4 text-gray-900 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          },
            suggestion
          )
        )
      )
    )
  );
};

export default AutocompleteInput;