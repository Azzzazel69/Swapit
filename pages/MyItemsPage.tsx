import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../services/api.js';
import ItemCard from '../components/ItemCard.js';
import Spinner from '../components/Spinner.js';
import Button from '../components/Button.js';
import Input from '../components/Input.js';
import { ICONS, CATEGORIES } from '../constants.js';
import { useAuth } from '../hooks/useAuth.tsx';
import { useColorTheme } from '../hooks/useColorTheme.js';

const MyItemsPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const shouldShowForm = queryParams.get('action') === 'add';

  const [showForm, setShowForm] = useState(shouldShowForm);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  // FIX: Explicitly type the 'images' state as an array of strings.
  const [images, setImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const { user } = useAuth();
  const { theme } = useColorTheme();

  const fetchUserItems = async () => {
    try {
      setLoading(true);
      if (user) {
        const userItems = await api.getUserItems(user.id);
        setItems(userItems);
      }
      setError(null);
    } catch (err) {
      setError('Error al cargar tus artículos.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('action') === 'add') {
      setShowForm(true);
    }
  }, [location.search]);

  const MAX_IMAGES = 5;

  // FIX: Add type for the event parameter to correctly infer 'e.target.files' and 'file' types.
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
          setError(null);
          const filesArray = Array.from(e.target.files);
          
          if (images.length + filesArray.length > MAX_IMAGES) {
              setError(`No puedes subir más de ${MAX_IMAGES} imágenes.`);
              return;
          }

          // FIX: Explicitly type 'file' as File to resolve properties 'size', 'name' and allow its use in readAsDataURL.
          filesArray.forEach((file: File) => {
              if (file.size > 10 * 1024 * 1024) { // 10MB limit
                  setError(`La imagen ${file.name} es demasiado grande (máx 10MB).`);
                  return;
              }
              const reader = new FileReader();
              reader.onloadend = () => {
                  // FIX: The result of FileReader can be an ArrayBuffer. We capture the narrowed string type in a constant
                  // to ensure TypeScript correctly infers its type inside the state updater callback.
                  if (typeof reader.result === 'string') {
                    const newImage = reader.result;
                    setImages(prevImages => [...prevImages, newImage]);
                  }
              };
              reader.readAsDataURL(file);
          });
          // FIX: Set target value to null to allow selecting the same file again.
          e.target.value = null; // To allow selecting the same file again
      }
  };

  const handleRemoveImage = (index) => {
      setImages(images.filter((_, i) => i !== index));
  };

  // FIX: Add type for the form event.
  const handleAddItem = async (e: React.FormEvent<HTMLFormElement>) => {
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
      await api.createItem({ title, description, category, imageUrls: images });
      setTitle('');
      setDescription('');
      setCategory('');
      setImages([]);
      setShowForm(false);
      await fetchUserItems(); // Refresh list
      setSuccessMessage('¡Artículo añadido con éxito!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Error al crear el artículo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return React.createElement("div", { className: "flex justify-center items-center h-64" }, React.createElement(Spinner, null));
  }

  return React.createElement("div", null,
    React.createElement("div", { className: "flex justify-between items-center mb-6" },
      React.createElement("h1", { className: "text-3xl font-bold text-gray-900 dark:text-white" }, "Mis Artículos"),
      React.createElement(Button, { 
        onClick: () => setShowForm(!showForm),
        children: React.createElement("div", { className: "flex items-center gap-2" },
          ICONS.plus,
          showForm ? 'Cancelar' : 'Añadir Nuevo Artículo'
        )
      })
    ),
    showForm && React.createElement("div", { className: "bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8" },
      React.createElement("form", { onSubmit: handleAddItem, className: "space-y-4" },
        React.createElement("h2", { className: "text-xl font-semibold" }, "Detalles del Nuevo Artículo"),
        error && React.createElement("p", { className: "text-red-500 text-sm text-center p-2 bg-red-100 dark:bg-red-900/50 rounded-md" }, error),
        React.createElement(Input, { id: "title", label: "Título", type: "text", value: title, onChange: e => setTitle(e.target.value), required: true }),
        React.createElement("div", null,
          React.createElement("label", { htmlFor: "description", className: "block text-sm font-medium text-gray-700 dark:text-gray-300" }, "Descripción"),
          // FIX: Add explicit type for the onChange event to help TypeScript resolve the correct overload for createElement.
          React.createElement("textarea", { id: "description", value: description, onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value), required: true, rows: 4, className: `mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 ${theme.focus} focus:${theme.border} sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100` })
        ),
        React.createElement("div", null,
          React.createElement("label", { htmlFor: "category", className: "block text-sm font-medium text-gray-700 dark:text-gray-300" }, "Categoría"),
          // FIX: Add explicit type for the onChange event to help TypeScript resolve the correct overload for createElement.
          React.createElement("select", { id: "category", value: category, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => setCategory(e.target.value), required: true, className: `mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 ${theme.focus} focus:${theme.border} sm:text-sm rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100` },
            React.createElement("option", { value: "", disabled: true }, "-- Selecciona una Categoría --"),
            ...CATEGORIES.map(cat => React.createElement("option", { key: cat, value: cat }, cat))
          )
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
        React.createElement("div", { className: "flex justify-end" },
          React.createElement(Button, { type: "submit", isLoading: isSubmitting, children: "Añadir Artículo" })
        )
      )
    ),
    items.length === 0 ? (
      React.createElement("p", { className: "text-center text-gray-500 dark:text-gray-400" }, "Aún no has añadido ningún artículo.")
    ) : (
      React.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6" },
        items.map((item) => React.createElement(ItemCard, { key: item.id, item: item, isOwnItem: true }))
      )
    ),
    successMessage && React.createElement("div", {
        className: "fixed bottom-5 right-5 bg-green-100 border border-green-400 text-green-700 dark:bg-green-800 dark:border-green-600 dark:text-green-200 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50",
        role: "alert"
      },
      React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" },
        React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" })
      ),
      React.createElement("span", { className: "font-medium" }, successMessage)
    )
  );
};

export default MyItemsPage;