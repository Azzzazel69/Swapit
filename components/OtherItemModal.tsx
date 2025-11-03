import React, { useState } from 'react';
import Button from './Button.tsx';
import { ICONS } from '../constants.tsx';
import { useColorTheme } from '../hooks/useColorTheme.tsx';
import { api } from '../services/api.ts';

const OtherItemModal = ({ isOpen, onClose, onSave }) => {
    const [description, setDescription] = useState('');
    const [images, setImages] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const { theme } = useColorTheme();
    const formId = "other-item-form";

    const resetState = () => {
        setDescription('');
        setImages([]);
        setError('');
        setIsSubmitting(false);
    };

    const handleClose = () => {
        resetState();
        onClose();
    };

    if (!isOpen) return null;

    const MAX_IMAGES = 5;

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setError('');
            const filesArray = Array.from(e.target.files);
            
            if (images.length + filesArray.length > MAX_IMAGES) {
                setError(`No puedes subir más de ${MAX_IMAGES} imágenes.`);
                return;
            }

            const resizingPromises = filesArray.map(file => api.resizeImageBeforeUpload(file));

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
        if (!description.trim()) {
            setError('La descripción no puede estar vacía.');
            return;
        }
        setError('');
        setIsSubmitting(true);
        try {
            await onSave({ description, imageUrls: images });
            handleClose();
        } catch (err) {
            setError(err.message || 'Error al añadir el artículo.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return React.createElement("div", { className: "fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4", onClick: handleClose },
        React.createElement("div", { className: "bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col", onClick: e => e.stopPropagation() },
            React.createElement("div", { className: "p-4 border-b dark:border-gray-700 flex justify-between items-center" },
                React.createElement("h2", { className: "text-xl font-bold" }, "Añadir Otro Artículo"),
                React.createElement("button", { onClick: handleClose, className: "text-gray-500 hover:text-gray-800 dark:hover:text-gray-200" }, ICONS.close)
            ),
            React.createElement("form", { id: formId, onSubmit: handleSubmit, className: "flex-grow overflow-y-auto p-6 space-y-4" },
                error && React.createElement("p", { className: "text-red-500 text-sm text-center p-2 bg-red-100 dark:bg-red-900/50 rounded-md" }, error),
                React.createElement("div", null,
                    React.createElement("label", { htmlFor: "other-description", className: "block text-sm font-medium text-gray-700 dark:text-gray-300" }, "Descripción Detallada"),
                    React.createElement("textarea", { id: "other-description", value: description, onChange: (e) => setDescription(e.target.value), required: true, rows: 4, placeholder: "Describe el estado, marca, modelo, etc.", className: `mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 ${theme.focus} focus:${theme.border} sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100` })
                ),
                React.createElement("div", null,
                    React.createElement("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300" }, "Fotos (Opcional, máx. 5)"),
                    images.length > 0 && React.createElement("div", { className: "mt-2 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4" },
                        images.map((image, index) => React.createElement("div", { key: index, className: "relative group" },
                            React.createElement("img", { src: image, alt: `Preview ${index}`, className: "h-24 w-24 object-cover rounded-md" }),
                            React.createElement("button", { type: "button", onClick: () => handleRemoveImage(index), className: "absolute -top-1 -right-1 p-1 bg-red-600 text-white rounded-full opacity-75 group-hover:opacity-100 transition-opacity", "aria-label": "Eliminar imagen" },
                                React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-3 w-3", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" },
                                    React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M6 18L18 6M6 6l12 12" })
                                )
                            )
                        ))
                    ),
                    React.createElement("div", { className: "mt-2" },
                        React.createElement("label", { htmlFor: "file-upload-other", className: `relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium ${theme.textColor} ${theme.hoverTextColor} focus-within:outline-none p-2 border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center` },
                            React.createElement("span", null, "Subir fotos..."),
                            React.createElement("input", { id: "file-upload-other", name: "file-upload-other", type: "file", className: "sr-only", multiple: true, accept: "image/*", onChange: handleImageChange, disabled: images.length >= MAX_IMAGES })
                        )
                    )
                )
            ),
            React.createElement("div", { className: "p-4 bg-gray-50 dark:bg-gray-900 border-t dark:border-gray-700 flex justify-end gap-2" },
                React.createElement(Button, { variant: "secondary", onClick: handleClose, children: "Cancelar" }),
                React.createElement(Button, { type: "submit", form: formId, isLoading: isSubmitting, children: "Añadir a la Propuesta" })
            )
        )
    );
};

export default OtherItemModal;
