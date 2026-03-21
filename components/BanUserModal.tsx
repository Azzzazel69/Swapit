
import React, { useState } from 'react';
import Button from './Button.tsx';
import { ICONS } from '../constants.tsx';

const BanUserModal = ({ isOpen, onClose, onConfirm, userName }: { isOpen: boolean, onClose: () => void, onConfirm: (reason: string, details: string) => Promise<void>, userName: string }) => {
    const [reason, setReason] = useState('Artículo prohibido');
    const [details, setDetails] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const reasons = [
        "Artículo prohibido",
        "Insultos / Falta de respeto",
        "Estafa / Fraude",
        "Spam",
        "Cuenta falsa",
        "Incumplimiento de normas de la comunidad"
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        await onConfirm(reason, details);
        setIsSubmitting(false);
        onClose();
        setDetails('');
    };

    return React.createElement("div", { 
        className: "fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[80] p-4", 
        onClick: onClose 
    } as any,
        React.createElement("div", { className: "bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md flex flex-col", onClick: (e: any) => e.stopPropagation() } as any,
            React.createElement("div", { className: "p-4 border-b dark:border-gray-700 flex justify-between items-center" },
                React.createElement("h2", { className: "text-xl font-bold text-red-600 flex items-center gap-2" }, 
                    React.createElement("svg" as any, { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" } as any, React.createElement("path" as any, { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" } as any)),
                    `Suspender a ${userName}`
                ),
                React.createElement("button" as any, { onClick: onClose, className: "text-gray-500 hover:text-gray-800 dark:hover:text-gray-200" } as any, ICONS.close)
            ),
            React.createElement("form", { onSubmit: handleSubmit, className: "p-6" },
                React.createElement("p", { className: "text-sm text-gray-600 dark:text-gray-400 mb-4" },
                    "La suspensión es inmediata. Se enviará una notificación al usuario con el motivo."
                ),
                
                React.createElement("div", { className: "mb-4" },
                    React.createElement("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" }, "Motivo Principal"),
                    React.createElement("select" as any, {
                        className: "w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent",
                        value: reason,
                        onChange: (e: any) => setReason(e.target.value),
                        required: true
                    },
                        reasons.map(r => React.createElement("option", { key: r, value: r }, r))
                    )
                ),

                React.createElement("div", { className: "mb-4" },
                    React.createElement("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" }, "Detalles Adicionales (Opcional)"),
                    React.createElement("textarea" as any, {
                        className: "w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent",
                        rows: 3,
                        placeholder: "Ej: Publicó múltiples artículos ilegales y se le avisó previamente...",
                        value: details,
                        onChange: (e: any) => setDetails(e.target.value)
                    })
                ),

                React.createElement("div", { className: "flex justify-end gap-3 mt-6" },
                    React.createElement(Button, { variant: "secondary", onClick: onClose, type: "button", children: "Cancelar" }),
                    React.createElement(Button, { variant: "danger", type: "submit", isLoading: isSubmitting, children: "Suspender Cuenta" })
                )
            )
        )
    );
};

export default BanUserModal;
