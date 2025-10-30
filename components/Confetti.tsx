import React from 'react';

const ConfettiPiece = () => {
    const style = {
        left: `${Math.random() * 100}vw`,
        animationDuration: `${Math.random() * 2 + 3}s`,
        animationDelay: `${Math.random() * 2}s`,
        backgroundColor: `hsl(${Math.random() * 360}, 100%, 50%)`,
        transform: `rotate(${Math.random() * 360}deg)`,
        width: `${Math.random() * 10 + 5}px`,
        height: `${Math.random() * 10 + 5}px`,
    };
    return React.createElement("div", { className: "confetti-piece", style: style });
};

const Confetti = ({ count = 150 }) => {
    return React.createElement("div", { className: "fixed inset-0 pointer-events-none z-50" },
        React.createElement("style", null, `
            .confetti-piece {
                position: absolute;
                top: -20px;
                opacity: 0;
                animation-name: fall;
                animation-timing-function: linear;
                animation-iteration-count: 1;
            }
            @keyframes fall {
                0% { transform: translateY(-20px) rotateZ(0deg); opacity: 1; }
                100% { transform: translateY(110vh) rotateZ(720deg); opacity: 1; }
            }
        `),
        Array.from({ length: count }).map((_, index) =>
            React.createElement(ConfettiPiece, { key: index })
        )
    );
};

export default Confetti;