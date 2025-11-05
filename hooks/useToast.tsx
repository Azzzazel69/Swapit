
import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';

const ToastContext = createContext(undefined);

const ICONS = {
    success: React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" }, React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" })),
    error: React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" }, React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" }))
};

const Toast = ({ message, type, onRemove }) => {
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsExiting(true);
            setTimeout(onRemove, 300); // Allow time for exit animation
        }, 4000);

        return () => clearTimeout(timer);
    }, [onRemove]);

    const handleRemove = () => {
        setIsExiting(true);
        setTimeout(onRemove, 300);
    };

    const baseClasses = "flex items-center w-full max-w-xs p-4 space-x-4 text-gray-500 bg-white divide-x divide-gray-200 rounded-lg shadow-lg dark:text-gray-400 dark:divide-gray-700 dark:bg-gray-800";
    const animationClasses = `transition-all duration-300 ease-in-out ${isExiting ? 'opacity-0 transform translate-x-full' : 'opacity-100 transform translate-x-0'}`;
    const typeClasses = {
        success: "text-green-500 dark:text-green-400",
        error: "text-red-500 dark:text-red-400",
    };

    return (
        React.createElement("div", { className: `${baseClasses} ${animationClasses}`, role: "alert" },
            React.createElement("div", { className: typeClasses[type] }, ICONS[type]),
            React.createElement("div", { className: "pl-4 text-sm font-normal" }, message),
            React.createElement("button", { onClick: handleRemove, className: "-mx-1.5 -my-1.5 bg-white text-gray-400 hover:text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-gray-100 inline-flex h-8 w-8 dark:text-gray-500 dark:hover:text-white dark:bg-gray-800 dark:hover:bg-gray-700" },
                React.createElement("span", { className: "sr-only" }, "Close"),
                React.createElement("svg", { className: "w-5 h-5", fill: "currentColor", viewBox: "0 0 20 20" }, React.createElement("path", { fillRule: "evenodd", d: "M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z", clipRule: "evenodd" }))
            )
        )
    );
};

export const ToastContainer = () => {
    const { toasts, removeToast } = useToast();

    return (
        React.createElement("div", { "aria-live": "assertive", className: "fixed inset-0 flex items-end px-4 py-6 pointer-events-none sm:p-6 sm:items-start z-[100]" },
            React.createElement("div", { className: "w-full flex flex-col items-center space-y-4 sm:items-end" },
                toasts.map(toast => React.createElement(Toast, { key: toast.id, ...toast, onRemove: () => removeToast(toast.id) }))
            )
        )
    );
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((message, type = 'success') => {
        const id = Date.now();
        setToasts(prevToasts => [...prevToasts, { id, message, type }]);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
    }, []);

    const value = { toasts, showToast, removeToast };

    return (
        React.createElement(ToastContext.Provider, { value: value },
            children,
            React.createElement(ToastContainer, null)
        )
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};