import React, { useState, useEffect } from 'react';
import Button from './Button.tsx';
import Input from './Input.tsx';
import { ICONS, CATEGORIES_WITH_SUBCATEGORIES } from '../constants.tsx';
import { useColorTheme } from '../hooks/useColorTheme.tsx';
import { api } from '../services/api.ts';
import { ItemCondition } from '../types.ts';

const EditItemModal = ({ isOpen, onClose, item, onSave }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [condition, setCondition] = useState('');
    const [wishedItem, setWishedItem] = useState('');
    const [images, setImages] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const { theme } = useColorTheme();
    const formId = "edit-item-form";
    
    useEffect(() => {
        if (item) {
            setTitle(item.title);
            setDescription(item.description);
            setCategory(item.category);
            setCondition(item.condition || '');
            setImages(item.imageUrls);
            setWishedItem(item.wishedItem || '');
            setError(''); // Reset error when item changes
        }
    }, [item]);

    if (!isOpen || !item) return null;

    const MAX_IMAGES = 5;

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setError('');
            const filesArray = Array.from(e.target.files);
            
            if (images.length + filesArray.length > MAX_IMAGES) {
                setError(`No puedes subir más de ${MAX_IMAGES} imágenes.`);
                return;
            }

            const resizingPromises = filesArray.map(async (file: File) => {
                if (file.size > 10 * 1024 * 1024) { // 10MB limit
                    throw new Error(`La imagen ${file.name} es demasiado grande (máx 10MB).`);
                }
                return await api.resizeImageBeforeUpload(file);
            });

            try {
                const resizedImages = await Promise.all(resizingPromises);
                setImages(prevImages => [...prevImages, ...resizedImages]);
            } catch(err) {
                setError(err.message);
            }
            
            e.target.value = null;
        }
    };

    const handleRemoveImage = (indexToRemove) => {
        setImages(images.filter((_, index) => index !== indexToRemove));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (images.length === 0) {
            setError('Debes tener al menos una foto.');
            return;
        }
        if (!condition) {
            setError('Debes seleccionar la condición del artículo.');
            return;
        }
        setError('');
        setIsSubmitting(true);
        try {
            await onSave({ title, description, category, condition, imageUrls: images, wishedItem });
            onClose();
        } catch (err) {
            setError(err.message || 'Error al guardar los cambios.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return React.createElement("div", { className: "fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4", onClick: onClose },
        React.createElement("div", { className: "bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col", onClick: e => e.stopPropagation() },
            React.createElement("div", { className: "p-4 border-b dark:border-gray-700 flex justify-between items-center" },
                React.createElement("h2", { className: "text-xl font-bold" }, "Editar Artículo"),
                React.createElement("button", { onClick: onClose, className: "text-gray-500 hover:text-gray-800 dark:hover:text-gray-200" }, ICONS.close)
            ),
            React.createElement("form", { id: formId, onSubmit: handleSubmit, className: "flex-grow overflow-y-auto p-6 space-y-4" },
                error && React.createElement("p", { className: "text-red-500 text-sm text-center p-2 bg-red-100 dark:bg-red-900/50 rounded-md" }, error),
                React.createElement(Input, { id: "edit-title", label: "Título", type: "text", value: title, onChange: e => setTitle(e.target.value), required: true }),
                React.createElement("div", null,
                    React.createElement("label", { htmlFor: "edit-description", className: "block text-sm font-medium text-gray-700 dark:text-gray-300" }, "Descripción"),
                    React.createElement("textarea", { id: "edit-description", value: description, onChange: (e) => setDescription(e.target.value), required: true, rows: 4, className: `mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 ${theme.focus} focus:${theme.border} sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100` })
                ),
                React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4" },
                    React.createElement("div", null,
                        React.createElement("label", { htmlFor: "edit-category", className: "block text-sm font-medium text-gray-700 dark:text-gray-300" }, "Categoría"),
                        React.createElement("select", { id: "edit-category", value: category, onChange: (e) => setCategory(e.target.value), required: true, className: `mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 ${theme.focus} focus:${theme.border} sm:text-sm rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100` },
                            React.createElement("option", { value: "", disabled: true }, "-- Selecciona --"),
                            CATEGORIES_WITH_SUBCATEGORIES.map(cat => 
                                cat.sub.length > 0 ? (
                                    React.createElement("optgroup", { key: cat.name, label: cat.name },
                                        cat.sub.map(subCat => React.createElement("option", { key: subCat, value: subCat }, subCat))
                                    )
                                ) : (
                                    React.createElement("option", { key: cat.name, value: cat.name }, cat.name)
                                )
                            )
                        )
                    ),
                    React.createElement("div", null,
                        React.createElement("label", { htmlFor: "edit-condition", className: "block text-sm font-medium text-gray-700 dark:text-gray-300" }, "Condición"),
                        React.createElement("select", { id: "edit-condition", value: condition, onChange: (e) => setCondition(e.target.value), required: true, className: `mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 ${theme.focus} focus:${theme.border} sm:text-sm rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100` },
                            React.createElement("option", { value: "", disabled: true }, "-- Selecciona --"),
                            Object.values(ItemCondition).map(cond => React.createElement("option", { key: cond, value: cond }, cond))
                        )
                    )
                ),
                React.createElement("div", null,
                    React.createElement(Input, { 
                        id: "edit-wishedItem", 
                        label: "Artículo deseado a cambio (opcional)", 
                        type: "text", 
                        value: wishedItem, 
                        onChange: e => setWishedItem(e.target.value), 
                        placeholder: "Ej: Guitarra acústica, PS5, etc." 
                    }),
                    React.createElement("p", { className: "mt-1 text-xs text-gray-500 dark:text-gray-400" }, "Sé específico para encontrar un 'match' directo. Ej: \"Playstation 5\", \"Libro Dune tapa dura\".")
                ),
                React.createElement("div", null,
                    React.createElement("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300" }, "Imágenes (mín. 1, máx. 5)"),
                    React.createElement("div", { className: "mt-1 flex items-center justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md" },
                        React.createElement("div", { className: "space-y-1 text-center" },
                            React.createElement("svg", { className: "mx-auto h-12 w-12 text-gray-400", stroke: "currentColor", fill: "none", viewBox: "0 0 48 48", "aria-hidden": "true" },
                                React.createElement("path", { d: "M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" })
                            ),
                            React.createElement("div", { className: "flex text-sm text-gray-600 dark:text-gray-400" },
                                React.createElement("label", { htmlFor: "file-upload-edit", className: `relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium ${theme.textColor} ${theme.hoverTextColor} focus-within:outline-none` },
                                    React.createElement("span", null, "Sube tus archivos"),
                                    React.createElement("input", { id: "file-upload-edit", name: "file-upload-edit", type: "file", className: "sr-only", multiple: true, accept: "image/*", onChange: handleImageChange, disabled: images.length >= MAX_IMAGES })
                                ),
                                React.createElement("p", { className: "pl-1" }, "o arrástralos aquí")
                            ),
                            React.createElement("p", { className: "text-xs text-gray-500 dark:text-gray-500" }, "PNG, JPG, GIF hasta 10MB")
                        )
                    ),
                    images.length > 0 && React.createElement("div", { className: "mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4" },
                        images.map((image, index) => React.createElement("div", { key: index, className: "relative group" },
                            React.createElement("img", { src: image, alt: `Preview ${index}`, className: "h-24 w-24 object-cover rounded-md" }),
                            React.createElement("button", { type: "button", onClick: () => handleRemoveImage(index), className: "absolute -top-1 -right-1 p-1 bg-red-600 text-white rounded-full opacity-75 group-hover:opacity-100 transition-opacity", "aria-label": "Eliminar imagen" },
                                React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-3 w-3", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" },
                                    React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M6 18L18 6M6 6l12 12" })
                                )
                            )
                        ))
                    )
                )
            ),
            React.createElement("div", { className: "p-4 bg-gray-50 dark:bg-gray-900 border-t dark:border-gray-700 flex justify-end gap-2" },
                React.createElement(Button, { variant: "secondary", onClick: onClose, children: "Cancelar" }),
                React.createElement(Button, { type: "submit", form: formId, isLoading: isSubmitting, children: "Guardar Cambios" })
            )
        )
    );
};

export default EditItemModal;
