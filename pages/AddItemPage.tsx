
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button.tsx';
import Input from '../components/Input.tsx';
import { CATEGORIES_WITH_SUBCATEGORIES } from '../constants.tsx';
import { api } from '../services/api.ts';
import { useColorTheme } from '../hooks/useColorTheme.tsx';

const AddItemPage = () => {
    const navigate = useNavigate();
    const { theme } = useColorTheme();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [wishedItem, setWishedItem] = useState('');
    const [images, setImages] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const MAX_IMAGES = 5;

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setError(null);
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

    const handleRemoveImage = (index) => {
        setImages(images.filter((_, i) => i !== index));
    };

    const handleAddItem = async (e) => {
        e.preventDefault();
        if (images.length === 0) {
            setError('Debes subir al menos una foto.');
            return;
        }
        if (!category) {
            setError('Por favor, selecciona una categoría.');
            return;
        }
        setError(null);
        setIsSubmitting(true);
        try {
            await api.createItem({ title, description, category, imageUrls: images, wishedItem });
            navigate('/profile', { state: { message: '¡Artículo añadido con éxito!' } });
        } catch (err) {
            setError('Error al crear el artículo.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        React.createElement("div", { className: "max-w-2xl mx-auto" },
            React.createElement("div", { className: "bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md" },
                React.createElement("form", { onSubmit: handleAddItem, className: "space-y-4" },
                    React.createElement("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white" }, "Sube tu artículo"),
                    error && React.createElement("p", { className: "text-red-500 text-sm text-center p-2 bg-red-100 dark:bg-red-900/50 rounded-md" }, error),
                    React.createElement(Input, { id: "title", label: "Título", type: "text", value: title, onChange: e => setTitle(e.target.value), required: true, placeholder: "Ej: Bicicleta de montaña" }),
                    React.createElement("div", null,
                        React.createElement("label", { htmlFor: "description", className: "block text-sm font-medium text-gray-700 dark:text-gray-300" }, "Descripción"),
                        React.createElement("textarea", { id: "description", value: description, onChange: (e) => setDescription(e.target.value), required: true, rows: 4, placeholder: "Describe tu artículo, su estado, etc.", className: `mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 ${theme.focus} focus:${theme.border} sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100` })
                    ),
                    React.createElement("div", null,
                        React.createElement("label", { htmlFor: "category", className: "block text-sm font-medium text-gray-700 dark:text-gray-300" }, "Categoría"),
                        React.createElement("select", { id: "category", value: category, onChange: (e) => setCategory(e.target.value), required: true, className: `mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 ${theme.focus} focus:${theme.border} sm:text-sm rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100` },
                            React.createElement("option", { value: "", disabled: true }, "-- Selecciona una Categoría --"),
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
                        React.createElement(Input, {
                            id: "wishedItem",
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
                                    React.createElement("label", { htmlFor: "file-upload", className: `relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium ${theme.textColor} ${theme.hoverTextColor} focus-within:outline-none` },
                                        React.createElement("span", null, "Sube tus archivos"),
                                        React.createElement("input", { id: "file-upload", name: "file-upload", type: "file", className: "sr-only", multiple: true, accept: "image/*", onChange: handleImageChange, disabled: images.length >= MAX_IMAGES })
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
                    ),
                    React.createElement("div", { className: "flex justify-end gap-4" },
                        React.createElement(Button, { type: "button", variant: "secondary", onClick: () => navigate(-1), children: "Cancelar" }),
                        React.createElement(Button, { type: "submit", isLoading: isSubmitting, children: "Publicar Artículo" })
                    )
                )
            )
        )
    );
};

export default AddItemPage;