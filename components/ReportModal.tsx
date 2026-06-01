
import React, { useState, useMemo } from 'react';
import Button from './Button.tsx';
import { ICONS } from '../constants.tsx';

const REPORT_REASONS = {
    ITEM: [
        'Contenido inapropiado / Ofensivo',
        'Es una estafa / Fraude',
        'Artículo prohibido (armas, drogas, etc)',
        'Información falsa / Engañosa',
        'No es un artículo para trueque',
        'Otro'
    ],
    USER: [
        'Comportamiento abusivo / Acoso',
        'Sospecha de cuenta falsa / Bot',
        'Incumplimiento de intercambios',
        'Lenguaje ofensivo en el perfil',
        'Otro'
    ],
    MESSAGE: [
        'Imagen inapropiada / Desnudez',
        'Acoso / Insultos',
        'Spam / Publicidad',
        'Intento de estafa fuera de la app',
        'Otro'
    ]
};

const ReportModal = ({ isOpen, onClose, onSubmit, title, type = 'ITEM' }: { isOpen: boolean, onClose: () => void, onSubmit: (reason: string, details?: string) => Promise<void>, title: string, type?: string }) => {
    const [selectedReason, setSelectedReason] = useState('');
    const [customReason, setCustomReason] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const reasons = useMemo(() => REPORT_REASONS[type] || REPORT_REASONS.ITEM, [type]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        const finalReason = selectedReason;
        if (!finalReason.trim()) return;
        if (selectedReason === 'Otro' && !customReason.trim()) return;
        
        setIsLoading(true);
        await onSubmit(finalReason, customReason);
        setIsLoading(false);
        onClose();
        setSelectedReason('');
        setCustomReason('');
    };

    return (
        React.createElement("div" as any, { className: "fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[70] p-4", onClick: onClose },
            React.createElement("div" as any, { className: "bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md flex flex-col overflow-hidden", onClick: (e: any) => e.stopPropagation() },
                React.createElement("div", { className: "p-4 border-b dark:border-gray-700 flex justify-between items-center bg-red-50 dark:bg-red-900/20" },
                    React.createElement("h2", { className: "text-lg font-black text-red-600 dark:text-red-400 flex items-center gap-2 uppercase tracking-tighter" }, 
                        React.createElement("span", { className: "text-xl" }, "🚩"), 
                        title
                    ),
                    React.createElement("button" as any, { onClick: onClose, className: "text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 p-1" }, ICONS.close)
                ),
                React.createElement("form", { onSubmit: handleSubmit, className: "p-6" },
                    React.createElement("p", { className: "text-xs font-bold text-gray-500 dark:text-gray-400 mb-4 uppercase tracking-widest" },
                        "Selecciona el motivo del reporte"
                    ),
                    
                    React.createElement("div", { className: "space-y-2 mb-6" },
                        reasons.map(r => (
                            React.createElement("button" as any, {
                                key: r,
                                type: "button",
                                onClick: () => setSelectedReason(r),
                                className: `w-full text-left p-3 rounded-xl text-sm font-medium transition-all border-2 ${selectedReason === r ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300' : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300'}`
                            }, r)
                        ))
                    ),

                    React.createElement("div" as any, { className: "animate-fade-in-up" },
                        React.createElement("textarea" as any, {
                            className: "w-full p-3 border-2 border-gray-100 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm",
                            rows: 3,
                            placeholder: selectedReason === 'Otro' ? "Describe el problema detalladamente... (Obligatorio)" : "Añade detalles adicionales (Opcional)...",
                            value: customReason,
                            onChange: (e: any) => setCustomReason(e.target.value),
                            required: selectedReason === 'Otro'
                        })
                    ),

                    React.createElement("div", { className: "flex justify-end gap-3 mt-6" },
                        React.createElement(Button, { variant: "secondary", onClick: onClose, type: "button", className: "rounded-xl", children: "Cancelar" }),
                        React.createElement(Button, { 
                            variant: "danger", 
                            type: "submit", 
                            isLoading: isLoading, 
                            disabled: !selectedReason || (selectedReason === 'Otro' && !customReason.trim()),
                            className: "rounded-xl px-6",
                            children: "Enviar Reporte" 
                        })
                    )
                )
            )
        )
    );
};

export default ReportModal;
