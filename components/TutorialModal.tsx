
import React, { useState } from 'react';
import Button from './Button.tsx';
import { useColorTheme } from '../hooks/useColorTheme.tsx';

const Slide1_Illustration = () => (
  React.createElement("svg", { viewBox: "0 0 100 80", xmlns: "http://www.w3.org/2000/svg", className: "w-48 h-48" },
    React.createElement("path", { d: "M10 30 L10 70 L90 70 L90 30 L55 30 L45 20 L10 30 Z", fill: "#F3F4F6", stroke: "#9CA3AF", strokeWidth: "2" }),
    React.createElement("circle", { cx: "25", cy: "40", r: "8", fill: "#FBBF24" }),
    React.createElement("rect", { x: "40", y: "50", width: "20", height: "15", fill: "#3B82F6", rx: "2" }),
    React.createElement("path", { d: "M60 40 L70 55 L80 40 Z", fill: "#10B981" }),
    React.createElement("g", { transform: "translate(42, -5)" },
      React.createElement("circle", { cx: "8", cy: "8", r: "12", fill: "#34D399" }),
      React.createElement("path", { d: "M5 8 L11 8 M8 5 L8 11", stroke: "white", strokeWidth: "2", strokeLinecap: "round" })
    )
  )
);
const Slide2_Illustration = () => (
  React.createElement("svg", { viewBox: "0 0 100 80", xmlns: "http://www.w3.org/2000/svg", className: "w-48 h-48" },
      React.createElement("rect", { x: "10", y: "40", width: "20", height: "20", fill: "#FBBF24", rx: "2" }),
      React.createElement("rect", { x: "40", y: "40", width: "20", height: "20", fill: "#3B82F6", rx: "2" }),
      React.createElement("rect", { x: "70", y: "40", width: "20", height: "20", fill: "#10B981", rx: "2" }),
      React.createElement("g", { transform: "translate(10, -10) rotate(-15)" },
        React.createElement("circle", { cx: "45", cy: "25", r: "20", fill: "rgba(96, 165, 250, 0.2)", stroke: "#60A5FA", strokeWidth: "4" }),
        React.createElement("line", { x1: "60", y1: "40", x2: "80", y2: "60", stroke: "#60A5FA", strokeWidth: "4", strokeLinecap: "round" })
      )
  )
);
const Slide3_Illustration = () => (
  React.createElement("svg", { viewBox: "0 0 100 80", xmlns: "http://www.w3.org/2000/svg", className: "w-48 h-48" },
      React.createElement("rect", { x: "5", y: "30", width: "30", height: "30", fill: "#FBBF24", rx: "3" }),
      React.createElement("rect", { x: "65", y: "30", width: "30", height: "30", fill: "#3B82F6", rx: "3" }),
      React.createElement("path", { d: "M40 35 C 50 25, 50 25, 60 35", fill: "none", stroke: "#34D399", strokeWidth: "3", strokeDasharray: "5, 5" }),
      React.createElement("path", { d: "M55 35 L60 35 L60 30", fill: "none", stroke: "#34D399", strokeWidth: "3", strokeLinecap: "round", strokeLinejoin: "round" }),
      React.createElement("path", { d: "M60 55 C 50 65, 50 65, 40 55", fill: "none", stroke: "#34D399", strokeWidth: "3", strokeDasharray: "5, 5" }),
      React.createElement("path", { d: "M45 55 L40 55 L40 60", fill: "none", stroke: "#34D399", strokeWidth: "3", strokeLinecap: "round", strokeLinejoin: "round" })
  )
);

const slides = [
    {
        illustration: React.createElement(Slide1_Illustration, null),
        title: "1. Sube tus artículos",
        text: "Esas cosas que no usas, que tienes por casa y a las que quieres dar una segunda vida. ¡Hazles una foto y súbelas!"
    },
    {
        illustration: React.createElement(Slide2_Illustration, null),
        title: "2. Busca y encuentra",
        text: "Descubre un mundo de artículos que otros usuarios están deseando intercambiar. ¡Seguro que encuentras algo que te encanta!"
    },
    {
        illustration: React.createElement(Slide3_Illustration, null),
        title: "3. Propón un cambio",
        text: "¿Has encontrado algo que te guste? ¡No te cortes! Selecciona uno de tus artículos y propón un intercambio."
    }
];

const TutorialModal = ({ isOpen, onClose }) => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const { theme } = useColorTheme();

    if (!isOpen) return null;

    const handleNext = () => {
        if (currentSlide < slides.length - 1) {
            setCurrentSlide(currentSlide + 1);
        } else {
            onClose();
        }
    };
    
    const handleSkip = () => {
        onClose();
    };

    const slide = slides[currentSlide];

    return (
        React.createElement("div", { className: "fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" },
            React.createElement("div", { className: "bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md mx-auto text-center flex flex-col",
                 onClick: e => e.stopPropagation()
            },
                React.createElement("div", { className: "p-8 flex-grow" },
                    React.createElement("div", { className: "flex items-center justify-center h-48 mb-6" },
                        slide.illustration
                    ),
                    React.createElement("h2", { className: "text-2xl font-bold text-gray-900 dark:text-white mb-3" }, slide.title),
                    React.createElement("p", { className: "text-gray-600 dark:text-gray-300" }, slide.text)
                ),

                React.createElement("div", { className: "p-6 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl" },
                    React.createElement("div", { className: "flex justify-center items-center gap-3 mb-6" },
                        slides.map((_, index) => (
                            React.createElement("div", { key: index, className: `h-2 rounded-full transition-all ${currentSlide === index ? `w-4 bg-gradient-to-r ${theme.bg}` : 'w-2 bg-gray-300 dark:bg-gray-600'}` })
                        ))
                    ),
                    React.createElement("div", { className: "flex items-center justify-between" },
                        React.createElement(Button, { variant: "secondary", onClick: handleSkip, className: "!bg-transparent !text-gray-500 hover:!bg-gray-200 dark:hover:!bg-gray-700" }, "Omitir"),
                        React.createElement(Button, { onClick: handleNext },
                            currentSlide === slides.length - 1 ? '¡Entendido!' : 'Siguiente'
                        )
                    )
                )
            )
        )
    );
};

export default TutorialModal;
