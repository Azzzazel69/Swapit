
import React, { useState, useEffect, useMemo } from 'react';
import Button from './Button.tsx';
import { ICONS } from '../constants.tsx';
import OtherItemModal from './OtherItemModal.tsx';

const SelectableItemCard = ({ item, isSelected, onSelect, isOther = false, isMatch = false }: { item: any, isSelected: boolean, onSelect: (id: string) => void, isOther?: boolean, isMatch?: boolean }) => {
    const hasImage = item.imageUrls && item.imageUrls.length > 0;

    const ImagePlaceholder = () => (
        React.createElement("div", { className: "w-full h-24 bg-gray-100 dark:bg-gray-700 flex items-center justify-center" },
            React.createElement("div", { className: "text-gray-400 dark:text-gray-500" },
                React.cloneElement(ICONS.swap, { className: "h-10 w-10" })
            )
        )
    );
    
    // Fix: Extract props to a variable to bypass excess property checking
    const divProps = {
        onClick: () => onSelect(item.id),
        className: `relative cursor-pointer border-2 rounded-lg overflow-hidden transition-all duration-200 h-full flex flex-col ${isSelected ? 'border-blue-500 shadow-lg' : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'}`
    };

    return React.createElement("div" as any, divProps,
        isMatch && !isOther && (
            React.createElement("div", { className: "absolute top-1 left-1 z-10 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg flex items-center gap-1" },
                "⚡️ ¡MATCH!"
            )
        ),
        hasImage
            ? React.createElement("img", { src: item.imageUrls[0], alt: isOther ? 'Otro artículo' : item.title, className: "w-full h-24 object-cover" })
            : React.createElement(ImagePlaceholder, null),
        React.createElement("div", { className: "p-2 flex-grow" },
            React.createElement("p", { className: "text-sm font-semibold truncate" }, isOther ? 'Otro artículo' : item.title),
            isOther && React.createElement("p", { className: "text-xs text-gray-500 dark:text-gray-400 line-clamp-2 h-10" }, item.description)
        ),
        isSelected && React.createElement("div", { className: "absolute inset-0 bg-blue-500 bg-opacity-50 flex items-center justify-center" },
            React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-8 w-8 text-white", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" },
                React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M5 13l4 4L19 7" })
            )
        )
    );
};

const AddOtherItemCard = ({ onClick }: { onClick: () => void }) => {
    // Fix: Extract props to a variable to bypass excess property checking
    const divProps = {
        onClick: onClick,
        className: `cursor-pointer border-2 border-dashed border-gray-300 dark:border-gray-500 rounded-lg flex flex-col items-center justify-center p-2 text-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors h-full`
    };

    return React.createElement("div" as any, divProps,
        React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-8 w-8 mb-1", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" },
            React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M12 9v6m3-3H9" })
        ),
        React.createElement("span", { className: "text-sm font-semibold" }, "Añadir otro artículo")
    );
};

const ExchangeProposalModal = ({ 
    isOpen, 
    onClose, 
    userItems, 
    targetItem, 
    onSubmit, 
    isLoading, 
    isModification = false, 
    existingExchange = null 
}: { 
    isOpen: boolean, 
    onClose: () => void, 
    userItems: any[], 
    targetItem: any, 
    onSubmit: (data: any) => void, 
    isLoading: boolean, 
    isModification?: boolean, 
    existingExchange?: any 
}) => {
    const [selectedItemIds, setSelectedItemIds] = useState([]);
    const [otherItems, setOtherItems] = useState([]);
    const [message, setMessage] = useState('');
    const [isOtherItemModalOpen, setIsOtherItemModalOpen] = useState(false);
    const [cashPlus, setCashPlus] = useState(0);

    useEffect(() => {
        if (isModification && existingExchange) {
            setSelectedItemIds(existingExchange.offeredItemIds || []);
            setOtherItems(existingExchange.offeredOtherItems || []);
        } else {
            setSelectedItemIds([]);
            setOtherItems([]);
        }
    }, [isOpen, isModification, existingExchange]);
    
    const sortedUserItems = useMemo(() => {
        if (!userItems || !targetItem) return [];

        const checkMatch = (item: any, target: any) => {
            if (!target.wishedItem || typeof target.wishedItem !== 'string') return false;
            const searchTerms = target.wishedItem.toLowerCase().split(/[\s,]+/).filter(t => t.length >= 3);
            if (searchTerms.length === 0) return false;
            
            const title = (item.title || "").toLowerCase();
            const cat = (item.category || "").toLowerCase();
            return searchTerms.some(term => title.includes(term) || cat.includes(term));
        };

        const itemsWithMatchStatus = userItems.map(item => {
            const isMatch = checkMatch(item, targetItem);
            return { ...item, isMatch };
        });

        return itemsWithMatchStatus.sort((a, b) => (b.isMatch ? 1 : 0) - (a.isMatch ? 1 : 0));
    }, [userItems, targetItem]);

    if (!isOpen) return null;

    const handleSelect = (itemId) => {
        setSelectedItemIds(prev =>
            prev.includes(itemId)
                ? prev.filter(id => id !== itemId)
                : [...prev, itemId]
        );
    };

    const handleAddOtherItem = (item) => {
        const newItem = { ...item, id: `other-${Date.now()}-${Math.random().toString(36).substring(2, 9)}` };
        setOtherItems(prev => [...prev, newItem]);
        setSelectedItemIds(prev => [...prev, newItem.id]);
    };

    const handleRemoveOtherItem = (itemId) => {
        setOtherItems(prev => prev.filter(item => item.id !== itemId));
        handleSelect(itemId); // This will deselect it
    };

    const handleSubmit = () => {
        onSubmit({ 
            offeredItemIds: selectedItemIds.filter(id => !id.startsWith('other-')),
            otherItems: otherItems.filter(item => selectedItemIds.includes(item.id)),
            message,
            cashPlus
        });
    };
    
    const allSelectableItems = [...sortedUserItems, ...otherItems];

    // Fix: Extract props for textarea to fix TS error
    const textareaProps = {
        id: "proposal-message",
        rows: 3,
        value: message,
        onChange: (e) => setMessage(e.target.value),
        placeholder: "Puedes añadir un mensaje a tu propuesta...",
        className: "appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
    };

    return (
        React.createElement("div", { className: "fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4", onClick: onClose },
            React.createElement(OtherItemModal, { 
                isOpen: isOtherItemModalOpen, 
                onClose: () => setIsOtherItemModalOpen(false), 
                onSave: handleAddOtherItem 
            }),
            React.createElement("div", { className: "bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col", onClick: (e: any) => e.stopPropagation() } as any,
                React.createElement("div", { className: "p-4 border-b dark:border-gray-700 flex justify-between items-center" },
                    React.createElement("h2", { className: "text-xl font-bold" }, isModification ? "Modificar Propuesta" : "Proponer Intercambio"),
                    React.createElement("button" as any, { onClick: onClose, className: "text-gray-500 hover:text-gray-800 dark:hover:text-gray-200" } as any, ICONS.close)
                ),
                React.createElement("div", { className: "flex-grow overflow-y-auto p-6" },
                    React.createElement("div", { className: "mb-4" },
                        React.createElement("h3", { className: "font-semibold mb-2" }, "Estás interesado en:"),
                        React.createElement("div", { className: "p-2 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center gap-3" },
                            React.createElement("img", { src: targetItem.imageUrls[0], alt: targetItem.title, className: "w-16 h-16 object-cover rounded-md" }),
                            React.createElement("p", { className: "font-bold text-lg" }, targetItem.title)
                        )
                    ),
                    React.createElement("div", { className: "mb-4" },
                        React.createElement("h3", { className: "font-semibold mb-2" }, "Selecciona los artículos que ofreces a cambio:"),
                        React.createElement("div", { className: "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4" },
                            allSelectableItems.map(item => {
                                const isOther = item.id.startsWith('other-');
                                return (
                                    React.createElement("div", { key: item.id, className: `relative group ${item.isMatch ? 'animate-shake' : ''}` },
                                        React.createElement(SelectableItemCard, {
                                            item: item,
                                            isSelected: selectedItemIds.includes(item.id),
                                            onSelect: handleSelect,
                                            isOther: isOther,
                                            isMatch: item.isMatch
                                        }),
                                        isOther && React.createElement("button" as any, {
                                            onClick: (e: any) => { e.stopPropagation(); handleRemoveOtherItem(item.id); },
                                            className: "absolute -top-2 -right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity",
                                            "aria-label": "Eliminar este artículo de la oferta"
                                        }, React.createElement("svg", { xmlns:"http://www.w3.org/2000/svg", className:"h-3 w-3", fill:"none", viewBox:"0 0 24 24", stroke:"currentColor" }, React.createElement("path", { strokeLinecap:"round", strokeLinejoin:"round", strokeWidth:"2", d:"M6 18L18 6M6 6l12 12" })))
                                    )
                                );
                            }),
                            React.createElement(AddOtherItemCard, { onClick: () => setIsOtherItemModalOpen(true) })
                        )
                    ),
                    React.createElement("div", { className: "mt-4" },
                        React.createElement("label", { htmlFor: "proposal-message", className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" }, "Mensaje (opcional)"),
                        React.createElement("textarea", textareaProps)
                    ),
                    React.createElement("div", { className: "mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800" },
                        React.createElement("label", { className: "block text-sm font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2" }, "Añadir un Plus (Opcional)"),
                        React.createElement("div", { className: "flex items-center gap-3" },
                            React.createElement("span", { className: "text-2xl" }, "💶"),
                            React.createElement("input", {
                                type: "number",
                                value: cashPlus,
                                onChange: (e) => setCashPlus(Number(e.target.value)),
                                placeholder: "Ej: 20",
                                className: "w-32 px-3 py-2 border border-blue-200 dark:border-blue-700 rounded-lg bg-white dark:bg-gray-800 font-bold"
                            }),
                            React.createElement("span", { className: "font-bold text-gray-500" }, "€ adicionales para equilibrar el trueque")
                        )
                    )
                ),
                React.createElement("div", { className: "p-4 bg-gray-50 dark:bg-gray-900 border-t dark:border-gray-700 flex justify-end gap-2" },
                    React.createElement(Button, { variant: "secondary", onClick: onClose, children: "Cancelar" }),
                    React.createElement(Button, { 
                        onClick: handleSubmit, 
                        isLoading: isLoading, 
                        disabled: selectedItemIds.length === 0,
                        children: isModification ? "Guardar Cambios" : "Enviar Propuesta"
                    })
                )
            )
        )
    );
};

export default ExchangeProposalModal;
