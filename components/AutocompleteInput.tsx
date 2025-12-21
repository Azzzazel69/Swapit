
import React, { useState, useEffect, useRef } from 'react';
import { useColorTheme } from '../hooks/useColorTheme.tsx';

interface AutocompleteInputProps {
    label: string;
    id: string;
    value: string;
    onChange: (val: string) => void;
    onSelectSuggestion?: (suggestion: any) => void;
    placeholder?: string;
    isLoading?: boolean;
    suggestions: string[];
}

const AutocompleteInput: React.FC<AutocompleteInputProps> = ({ 
    label, id, value, onChange, suggestions, onSelectSuggestion, isLoading, ...props 
}) => {
    const { theme } = useColorTheme();
    const [showSuggestions, setShowSuggestions] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        onChange(val);
        if (val.trim().length >= 2) {
            setShowSuggestions(true);
        } else {
            setShowSuggestions(false);
        }
    };

    const handleFocus = () => {
        if (value.trim().length >= 2) setShowSuggestions(true);
    };

    const handleItemClick = (suggestion: string) => {
        if (onSelectSuggestion) {
            onSelectSuggestion(suggestion);
        } else {
            onChange(suggestion);
        }
        setShowSuggestions(false);
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <label htmlFor={id} className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                {label}
            </label>
            <div className="relative">
                <input
                    id={id}
                    value={value}
                    onChange={handleChange}
                    onFocus={handleFocus}
                    autoComplete="off"
                    className={`appearance-none block w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 ${theme.focus} focus:${theme.border} sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all`}
                    {...props}
                />
                {isLoading && (
                    <div className="absolute right-3 top-2.5">
                        <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    </div>
                )}
            </div>

            {showSuggestions && (suggestions.length > 0 || isLoading) && (
                <ul className="absolute z-[100] w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl mt-1 max-h-72 overflow-auto shadow-2xl ring-1 ring-black ring-opacity-5 animate-fade-in-up">
                    {isLoading && suggestions.length === 0 ? (
                        <li className="p-4 flex items-center justify-center gap-3 text-sm text-gray-500 dark:text-gray-400 italic">
                            <svg className="animate-spin h-4 w-4 text-gray-400" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Buscando municipios...
                        </li>
                    ) : suggestions.length > 0 ? (
                        suggestions.map((s, idx) => (
                            <li
                                key={idx}
                                onClick={() => handleItemClick(s)}
                                className="cursor-pointer select-none py-3 px-4 text-gray-900 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 border-b last:border-0 border-gray-100 dark:border-gray-700 flex items-center gap-2 transition-colors"
                            >
                                <span className="text-gray-400 flex-shrink-0">📍</span>
                                <span className="flex-grow font-medium truncate">{s}</span>
                            </li>
                        ))
                    ) : !isLoading && value.trim().length >= 2 ? (
                        <li className="p-4 text-center text-sm text-gray-400 italic">No se han encontrado resultados oficiales</li>
                    ) : null}
                </ul>
            )}
        </div>
    );
};

export default AutocompleteInput;
