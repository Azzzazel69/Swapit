import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.tsx';
import Button from '../components/Button.js';
import Input from '../components/Input.js';
import { ICONS, CATEGORIES } from '../constants.js';
import { api } from '../services/api.js';
import { useColorTheme } from '../hooks/useColorTheme.js';
import ItemCard from '../components/ItemCard.js';
import Spinner from '../components/Spinner.js';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const { theme } = useColorTheme();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Profile state
  const [preferences, setPreferences] = useState(user?.preferences || []);
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);
  const [prefsSaved, setPrefsSaved] = useState(false);

  // My Items state
  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [itemsError, setItemsError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [images, setImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [deletingItemId, setDeletingItemId] = useState(null);
  
  const fetchUserItems = async () => {
    try {
      setLoadingItems(true);
      if (user) {
        const userItems = await api.getUserItems(user.id);
        setItems(userItems);
      }
      setItemsError(null);
    } catch (err) {
      setItemsError('Error al cargar tus artículos.');
      console.error(err);
    } finally {
      setLoadingItems(false);
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

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
  };
  
  useEffect(() => {
    if (location.state?.message) {
        showNotification(location.state.message);
        window.history.replaceState({}, document.title);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  const handlePreferenceChange = (category) => {
    setPreferences(prev => 
      prev.includes(category) 
        ? prev.filter(p => p !== category) 
        : [...prev, category]
    );
    setPrefsSaved(false);
  };

  const handleSavePreferences = async () => {
    if (!user) return;
    setIsSavingPrefs(true);
    try {
        const updatedUser = await api.updateUserPreferences(preferences);
        updateUser(updatedUser);
        setPrefsSaved(true);
        setTimeout(() => setPrefsSaved(false), 2000);
    } catch (error) {
        console.error("Error al guardar las preferencias", error);
    } finally {
        setIsSavingPrefs(false);
    }
  };
  
  const MAX_IMAGES = 5;

  // FIX: Add type for event parameter to allow type inference for file objects.
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
          setItemsError(null);
          const filesArray = Array.from(e.target.files);
          
          if (images.length + filesArray.length > MAX_IMAGES) {
              setItemsError(`No puedes subir más de ${MAX_IMAGES} imágenes.`);
              return;
          }

          // FIX: Add explicit type for 'file' to resolve type inference issue.
          filesArray.forEach((file: File) => {
              if (file.size > 10 * 1024 * 1024) { // 10MB limit
                  setItemsError(`La imagen ${file.name} es demasiado grande (máx 10MB).`);
                  return;
              }
              const reader = new FileReader();
              reader.onloadend = () => {
                  if (typeof reader.result === 'string') {
                    setImages(prevImages => [...prevImages, reader.result]);
                  }
              };
              reader.readAsDataURL(file);
          });
          e.target.value = null;
      }
  };

  const handleRemoveImage = (index) => {
      setImages(images.filter((_, i) => i !== index));
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (images.length === 0) {
        setItemsError('Debes subir al menos una foto.');
        return;
    }
    if (!category) {
        setItemsError('Por favor, selecciona una categoría.');
        return;
    }
    setItemsError(null);
    setIsSubmitting(true);
    try {
      await api.createItem({ title, description, category, imageUrls: images });
      setTitle('');
      setDescription('');
      setCategory('');
      setImages([]);
      setShowForm(false);
      await fetchUserItems();
      showNotification('¡Artículo añadido con éxito!');
    } catch (err) {
      setItemsError('Error al crear el artículo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este artículo? Esta acción no se puede deshacer.')) {
        setDeletingItemId(itemId);
        try {
            await api.deleteItem(itemId);
            setItems(prevItems => prevItems.filter(item => item.id !== itemId));
            showNotification('Artículo eliminado con éxito.');
        } catch (err) {
            showNotification(err.message || 'Error al eliminar el artículo.', 'error');
        } finally {
            setDeletingItemId(null);
        }
    }
  };

  if (!user) {
    return React.createElement("p", null, "Cargando perfil...");
  }

  return React.createElement("div", { className: "max-w-4xl mx-auto" },
    React.createElement("h1", { className: "text-3xl font-bold mb-6 text-gray-900 dark:text-white" }, "Mi Perfil"),
    
    // User Info Section
    React.createElement("div", { className: "bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8" },
        React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4" },
          React.createElement("div", null,
            React.createElement("h3", { className: "text-lg font-medium text-gray-900 dark:text-white" }, "Nombre"),
            React.createElement("p", { className: "mt-1 text-sm text-gray-600 dark:text-gray-300" }, user.name)
          ),
          React.createElement("div", null,
            React.createElement("h3", { className: "text-lg font-medium text-gray-900 dark:text-white" }, "Correo Electrónico"),
            React.createElement("p", { className: "mt-1 text-sm text-gray-600 dark:text-gray-300" }, user.email)
          )
        )
    ),

    // Preferences Section
    React.createElement("div", { className: "bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8" },
        React.createElement("h3", { className: "text-xl font-semibold text-gray-900 dark:text-white" }, "Mis Intereses"),
        React.createElement("p", { className: "text-sm text-gray-600 dark:text-gray-300 mt-1 mb-3" }, "Selecciona las categorías que te interesan para personalizar tu página de inicio."),
        React.createElement("div", { className: "grid grid-cols-2 sm:grid-cols-3 gap-2" },
           CATEGORIES.map(category => React.createElement("label", { key: category, className: "flex items-center space-x-2 cursor-pointer" },
             React.createElement("input", { 
               type: "checkbox",
               className: `h-4 w-4 rounded border-gray-300 ${theme.textColor} ${theme.focus}`,
               checked: preferences.includes(category),
               onChange: () => handlePreferenceChange(category)
             }),
             React.createElement("span", { className: "text-sm text-gray-700 dark:text-gray-300" }, category)
           ))
        ),
        React.createElement("div", { className: "mt-4 flex items-center gap-4" },
           React.createElement(Button, { onClick: handleSavePreferences, isLoading: isSavingPrefs, children: "Guardar Preferencias" }),
           prefsSaved && React.createElement("span", { className: "text-green-600 text-sm" }, "¡Preferencias guardadas!")
        )
    ),

    // My Items Section
    React.createElement("div", { className: "mt-8" },
      React.createElement("div", { className: "flex justify-between items-center mb-6" },
        React.createElement("h2", { className: "text-3xl font-bold text-gray-900 dark:text-white" }, "Mis Artículos"),
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
          itemsError && React.createElement("p", { className: "text-red-500 text-sm text-center p-2 bg-red-100 dark:bg-red-900/50 rounded-md" }, itemsError),
          React.createElement(Input, { id: "title", label: "Título", type: "text", value: title, onChange: e => setTitle(e.target.value), required: true }),
          React.createElement("div", null,
            React.createElement("label", { htmlFor: "description", className: "block text-sm font-medium text-gray-700 dark:text-gray-300" }, "Descripción"),
            React.createElement("textarea", { id: "description", value: description, onChange: (e) => setDescription(e.target.value), required: true, rows: 4, className: `mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 ${theme.focus} focus:${theme.border} sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100` })
          ),
          React.createElement("div", null,
            React.createElement("label", { htmlFor: "category", className: "block text-sm font-medium text-gray-700 dark:text-gray-300" }, "Categoría"),
            React.createElement("select", { id: "category", value: category, onChange: (e) => setCategory(e.target.value), required: true, className: `mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 ${theme.focus} focus:${theme.border} sm:text-sm rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100` },
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
      loadingItems ? React.createElement(Spinner, null) :
      items.length === 0 ? (
        React.createElement("p", { className: "text-center text-gray-500 dark:text-gray-400" }, "Aún no has añadido ningún artículo.")
      ) : (
        React.createElement("div", { className: "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" },
          items.map((item) => React.createElement(ItemCard, { key: item.id, item: item, isOwnItem: true, onDelete: handleDeleteItem, deletingItemId: deletingItemId }))
        )
      )
    ),
    notification.show && React.createElement("div", {
        className: `fixed bottom-5 right-5 ${notification.type === 'success' ? 'bg-green-100 border-green-400 text-green-700 dark:bg-green-800 dark:border-green-600 dark:text-green-200' : 'bg-red-100 border-red-400 text-red-700 dark:bg-red-800 dark:border-red-600 dark:text-red-200'} px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50`,
        role: "alert"
      },
      React.createElement("span", { className: "font-medium" }, notification.message)
    )
  );
};

export default ProfilePage;