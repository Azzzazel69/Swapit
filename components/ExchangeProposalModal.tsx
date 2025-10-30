import React, { useState } from 'react';
import Button from './Button.js';
import { ICONS } from '../constants.js';

const SelectableItemCard = ({ item, isSelected, onSelect }) => {
    return React.createElement("div", {
        onClick: () => onSelect(item.id),
        className: `cursor-pointer border-2 rounded-lg overflow-hidden transition-all duration-200 ${isSelected ? 'border-blue-500 shadow-lg' : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'}`
    },
        React.createElement("img", { src: item.imageUrls[0], alt: item.title, className: "w-full h-24 object-cover" }),
        React.createElement("div", { className: "p-2" },
            React.createElement("p", { className: "text-sm font-semibold truncate" }, item.title)
        ),
        isSelected && React.createElement("div", { className: "absolute inset-0 bg-blue-500 bg-opacity-50 flex items-center justify-center" },
            React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-8 w-8 text-white", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" },
                React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M5 13l4 4L19 7" })
            )
        )
    );
};

const ExchangeProposalModal = ({ isOpen, onClose, userItems, targetItem, onSubmit, isLoading }) => {
    const [selectedItemIds, setSelectedItemIds] = useState([]);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const formId = "exchange-proposal-form";

    const handleSelect = (itemId) => {
        setSelectedItemIds(prev =>
            prev.includes(itemId)
                ? prev.filter(id => id !== itemId)
                : [...prev, itemId]
        );
    };

    // FIX: Added type to event object to help TypeScript infer correct form element type.
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (selectedItemIds.length === 0) {
            setError('Debes seleccionar al menos un artículo para ofrecer.');
            return;
        }
        setError('');
        onSubmit({ offeredItemIds: selectedItemIds, message });
    };

    if (!isOpen) return null;

    return React.createElement("div", { className: "fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" },
        React.createElement("div", { className: "bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col", onClick: e => e.stopPropagation() },
            React.createElement("div", { className: "p-4 border-b dark:border-gray-700 flex justify-between items-center" },
                React.createElement("h2", { className: "text-xl font-bold" }, "Proponer intercambio por ", React.createElement("span", { className: "text-blue-500" }, targetItem.title)),
                React.createElement("button", { onClick: onClose, className: "text-gray-500 hover:text-gray-800 dark:hover:text-gray-200" }, ICONS.close)
            ),
// FIX: The `handleSubmit` function was used for both form `onSubmit` (FormEvent) and button `onClick` (MouseEvent), causing a type conflict that broke TypeScript's overload resolution for `React.createElement`. By giving the form an `id` and using the `form` attribute on the submit button, we remove the need for the `onClick` handler on the button, thus resolving the type conflict.
            React.createElement("form", { id: formId, onSubmit: handleSubmit, className: "flex-grow overflow-y-auto" },
                React.createElement("div", { className: "p-6" },
                    React.createElement("h3", { className: "font-semibold mb-2" }, "1. Elige qué artículo(s) quieres ofrecer:"),
                    React.createElement("div", { className: "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-4" },
                        userItems.map(item => React.createElement(SelectableItemCard, {
                            key: item.id,
                            item: item,
                            isSelected: selectedItemIds.includes(item.id),
                            onSelect: handleSelect
                        }))
                    ),
                    React.createElement("h3", { className: "font-semibold mb-2" }, "2. (Opcional) Envía un mensaje al propietario:"),
                    React.createElement("textarea", {
                        value: message,
                        // FIX: Added type to event object to help TypeScript infer correct textarea element type.
                        onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value),
                        rows: 3,
                        placeholder: `Ej: "Hola ${targetItem.ownerName}, me interesa tu ${targetItem.title}. ¿Te gustaría intercambiarlo por mi artículo?"`,
                        className: "mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    }),
                    error && React.createElement("p", { className: "text-red-500 text-sm mt-2" }, error)
                )
            ),
            React.createElement("div", { className: "p-4 bg-gray-50 dark:bg-gray-900 border-t dark:border-gray-700 flex justify-end gap-2" },
                React.createElement(Button, { variant: "secondary", onClick: onClose, children: "Cancelar" }),
                React.createElement(Button, { type: "submit", form: formId, isLoading: isLoading, disabled: selectedItemIds.length === 0, children: "Enviar Propuesta" })
            )
        )
    );
};

export default ExchangeProposalModal;