
import React, { createContext, useState, useContext, useCallback } from 'react';
import Confetti from '../components/Confetti.tsx';

const ConfettiContext = createContext({
    showConfetti: () => {},
});

export const ConfettiProvider = ({ children }) => {    
    const [isShowing, setIsShowing] = useState(false);

    const showConfetti = useCallback(() => {
        if (isShowing) return; // Prevent multiple triggers
        setIsShowing(true);
        // Reset state after animation is done to allow re-triggering
        setTimeout(() => setIsShowing(false), 3000); 
    }, [isShowing]);

    return (
        React.createElement(ConfettiContext.Provider, { value: { showConfetti } },
            children,
            isShowing && React.createElement(Confetti, { show: true })
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