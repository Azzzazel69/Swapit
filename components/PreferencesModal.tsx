import React, { useState } from 'react';
import { CATEGORIES_WITH_SUBCATEGORIES, ICONS } from '../constants.tsx';
import { useColorTheme } from '../hooks/useColorTheme.tsx';
import Button from './Button.tsx';

const CategoryPreferencesGroup = ({ category, subcategories, selected, onChange }) => {
    const { theme } = useColorTheme();
    const isAllSelected = subcategories.every(sub => selected.includes(sub));

    const handleSelectAll = (e) => {
        e.stopPropagation();
        const allSubs = subcategories;
        const currentSelection = selected;
        const newSelection = isAllSelected 
            ? currentSelection.filter(p => !allSubs.includes(p))
            : [...new Set([...currentSelection, ...allSubs])];
        onChange(newSelection);
    };

    return (
        React.createElement("details", { className: "group bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3", open: true },
            React.createElement("summary", { className: "flex justify-between items-center font-semibold cursor-pointer" },
                React.createElement("span", { className: "text-lg" }, category),
                React.createElement("div", { className: "flex items-center gap-4" },
                    React.createElement("button", { 
                        onClick: handleSelectAll, 
                        className: `text-xs font-bold ${theme.textColor} hover:underline` 
                    }, isAllSelected ? "Deseleccionar todo" : "Seleccionar todo"),
                    React.createElement("span", { className: "transition-transform duration-300 group-open:rotate-180" }, "▼")
                )
            ),
            React.createElement("div", { className: "grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 mt-2 border-t border-gray-200 dark:border-gray-600" },
                subcategories.map(sub => (
                    React.createElement("label", { key: sub, className: "flex items-center space-x-2 cursor-pointer" },
                        React.createElement("input", {
                            type: "checkbox",
                            className: `h-4 w-4 rounded border-gray-300 ${theme.textColor} ${theme.focus}`,
                            checked: selected.includes(sub),
                            onChange: () => onChange(sub)
                        }),
                        React.createElement("span", { className: "text-sm text-gray-700 dark:text-gray-300" }, sub)
                    )
                ))
            )
        )
    );
};

const PreferencesModal = ({ isOpen, onClose, initialPreferences, onSave }) => {
    const [preferences, setPreferences] = useState(initialPreferences || []);
    const [isSaving, setIsSaving] = useState(false);

    if (!isOpen) return null;

    const handlePreferenceChange = (categoryOrSubcategories) => {
        if (Array.isArray(categoryOrSubcategories)) {
            setPreferences(categoryOrSubcategories);
        } else {
            setPreferences(prev => 
                prev.includes(categoryOrSubcategories) 
                    ? prev.filter(p => p !== categoryOrSubcategories) 
                    : [...prev, categoryOrSubcategories]
            );
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSave(preferences);
            onClose();
        } catch (error) {
            console.error("Error saving preferences in modal", error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        React.createElement("div", { className: "fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4", onClick: onClose },
            React.createElement("div", { className: "bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col", onClick: e => e.stopPropagation() },
                React.createElement("div", { className: "p-4 border-b dark:border-gray-700 flex justify-between items-center" },
                    React.createElement("h2", { className: "text-xl font-bold" }, "Editar Intereses"),
                    React.createElement("button", { onClick: onClose, className: "text-gray-500 hover:text-gray-800 dark:hover:text-gray-200" }, ICONS.close)
                ),
                React.createElement("div", { className: "flex-grow overflow-y-auto p-6 space-y-4" },
                    CATEGORIES_WITH_SUBCATEGORIES
                        .filter(c => c.sub.length > 0)
                        .map(category => (
                            React.createElement(CategoryPreferencesGroup, {
                                key: category.name,
                                category: category.name,
                                subcategories: category.sub,
                                selected: preferences,
                                onChange: handlePreferenceChange
                            })
                        ))
                ),
                React.createElement("div", { className: "p-4 bg-gray-50 dark:bg-gray-900 border-t dark:border-gray-700 flex justify-end gap-2" },
                    React.createElement(Button, { variant: "secondary", onClick: onClose, children: "Cancelar" }),
                    React.createElement(Button, { onClick: handleSave, isLoading: isSaving, children: "Guardar Intereses" })
                )
            )
        )
    );
};

export default PreferencesModal;
