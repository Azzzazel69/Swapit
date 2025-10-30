import React, { createContext, useState, useContext, useCallback } from 'react';
import Confetti from '../components/Confetti.js';

const ConfettiContext = createContext({
    showConfetti: () => {},
});

export const ConfettiProvider = ({ children }) => {    
    const [isShowing, setIsShowing] = useState(false);

    const showConfetti = useCallback(() => {
        setIsShowing(true);
        setTimeout(() => setIsShowing(false), 5000); // Show for 5 seconds
    }, []);

    return (
        React.createElement(ConfettiContext.Provider, { value: { showConfetti } },
            children,
            isShowing && React.createElement(Confetti, null)
        )
    );
};

export const useConfetti = () => {
    const context = useContext(ConfettiContext);
    if (context === undefined) {
        throw new Error('useConfetti must be used within a ConfettiProvider');
    }
    return context;
};