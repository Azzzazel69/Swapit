
import React, { useState } from 'react';
import Button from './Button.tsx';
import { ICONS } from '../constants.tsx';

const ReportModal = ({ isOpen, onClose, onSubmit, title }) => {
    const [reason, setReason] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!reason.trim()) return;
        setIsLoading(true);
        await onSubmit(reason);
        setIsLoading(false);
        onClose();
        setReason('');
    };

    return (
        React.createElement("div", { className: "fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[70] p-4", onClick: onClose },
            React.createElement("div", { className: "bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md flex flex-col", onClick: e => e.stopPropagation() },
                React.createElement("div", { className: "p-4 border-b dark:border-gray-700 flex justify-between items-center" },
                    React.createElement("h2", { className: "text-xl font-bold text-red-600 flex items-center gap-2" }, 
                        ICONS.flag, 
                        title
                    ),
                    React.createElement("button", { onClick: onClose, className: "text-gray-500 hover:text-gray-800 dark:hover:text-gray-200" }, ICONS.close)
                ),
                React.createElement("form", { onSubmit: handleSubmit, className: "p-6" },
                    React.createElement("p", { className: "text-sm text-gray-600 dark:text-gray-400 mb-4" },
                        "Ayúdanos a mantener la comunidad segura. Describe por qué estás reportando este contenido."
                    ),
                    React.createElement("textarea", {
                        className: "w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent",
                        rows: 4,
                        placeholder: "Ej: Es una estafa, contenido inapropiado, spam...",
                        value: reason,
                        onChange: (e) => setReason(e.target.value),
                        required: true
                    }),
                    React.createElement("div", { className: "flex justify-end gap-3 mt-6" },
                        React.createElement(Button, { variant: "secondary", onClick: onClose, type: "button", children: "Cancelar" }),
                        React.createElement(Button, { variant: "danger", type: "submit", isLoading: isLoading, disabled: !reason.trim(), children: "Enviar Reporte" })
                    )
                )
            )
        )
    );
};

export default ReportModal;
