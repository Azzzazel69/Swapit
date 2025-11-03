import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.tsx';
import Button from '../components/Button.tsx';
import { ICONS, CATEGORIES_WITH_SUBCATEGORIES } from '../constants.tsx';
import { api } from '../services/api.ts';
import { useColorTheme } from '../hooks/useColorTheme.tsx';
import ItemCard from '../components/ItemCard.tsx';
import SwapSpinner from '../components/SwapSpinner.tsx';

const CategoryPreferences = ({ category, subcategories, selected, onChange }) => {
    const { theme } = useColorTheme();
    const isAllSelected = subcategories.every(sub => selected.includes(sub));

    const handleSelectAll = (e) => {
        e.stopPropagation();
        const allSubs = subcategories;
        const currentSelection = selected;
        const newSelection = isAllSelected 
            ? currentSelection.filter(p => !allSubs.includes(p))
            : [...new Set([...currentSelection, ...allSubs])];
        
        // This is a bit tricky; we need to call the parent's state setter directly.
        // It's better to pass a setter function for this.
        // For now, we'll assume the parent `onChange` can handle an array.
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
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [deletingItemId, setDeletingItemId] = useState(null);
  
  // My Favorites state
  const [favoriteItems, setFavoriteItems] = useState([]);
  const [loadingFavorites, setLoadingFavorites] = useState(true);

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

  const fetchFavoriteItems = async () => {
    try {
      setLoadingFavorites(true);
      if (user) {
        const favs = await api.getFavoriteItems();
        setFavoriteItems(favs);
      }
    } catch (err) {
      console.error("Error fetching favorites", err);
    } finally {
      setLoadingFavorites(false);
    }
  };

  useEffect(() => {
    fetchUserItems();
    fetchFavoriteItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
  };
  
  useEffect(() => {
    if (location.state?.message) {
        showNotification(location.state.message);
        if (typeof window !== 'undefined' && window.history) {
          window.history.replaceState({}, document.title);
        }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  const handlePreferenceChange = (categoryOrSubcategories) => {
    setPrefsSaved(false);
    if (Array.isArray(categoryOrSubcategories)) {
        // Handle select/deselect all
        setPreferences(categoryOrSubcategories);
    } else {
        // Handle single checkbox
        setPreferences(prev => 
            prev.includes(categoryOrSubcategories) 
                ? prev.filter(p => p !== categoryOrSubcategories) 
                : [...prev, categoryOrSubcategories]
        );
    }
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
  
  const handleToggleFavorite = async (itemId) => {
    try {
      await api.toggleFavorite(itemId);
      // Remove from local state immediately for better UX
      setFavoriteItems(prevItems => prevItems.filter(item => item.id !== itemId));
    } catch (error) {
        console.error("Error toggling favorite", error);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (typeof window !== 'undefined' && window.confirm('¿Estás seguro de que quieres eliminar este artículo? Esta acción no se puede deshacer.')) {
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
        React.createElement("div", { className: "space-y-4" },
            CATEGORIES_WITH_SUBCATEGORIES
                .filter(c => c.sub.length > 0)
                .map(category => (
                    React.createElement(CategoryPreferences, {
                        key: category.name,
                        category: category.name,
                        subcategories: category.sub,
                        selected: preferences,
                        onChange: handlePreferenceChange
                    })
                ))
        ),
        React.createElement("div", { className: "mt-4 flex items-center gap-4" },
           React.createElement(Button, { onClick: handleSavePreferences, isLoading: isSavingPrefs, children: "Guardar Intereses" }),
           prefsSaved && React.createElement("span", { className: "text-green-600 text-sm" }, "¡Intereses guardados!")
        )
    ),

    // My Favorites Section
    React.createElement("div", { className: "mt-8" },
      React.createElement("h2", { className: "text-3xl font-bold text-gray-900 dark:text-white mb-6" }, "Mis Favoritos"),
      loadingFavorites ? React.createElement(SwapSpinner, null) :
      favoriteItems.length === 0 ? (
        React.createElement("p", { className: "text-center text-gray-500 dark:text-gray-400" }, "Aún no has añadido ningún artículo a favoritos.")
      ) : (
        React.createElement("div", { className: "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" },
          favoriteItems.map((item) => React.createElement(ItemCard, { key: item.id, item: item, onToggleFavorite: handleToggleFavorite }))
        )
      )
    ),

    // My Items Section
    React.createElement("div", { className: "mt-8" },
      React.createElement("div", { className: "flex justify-between items-center mb-6" },
        React.createElement("h2", { className: "text-3xl font-bold text-gray-900 dark:text-white" }, "Mis Artículos"),
        React.createElement(Button, { 
          onClick: () => navigate('/add-item'),
          children: React.createElement("div", { className: "flex items-center gap-2" },
            ICONS.plus,
            'Añadir Nuevo Artículo'
          )
        })
      ),
      itemsError && React.createElement("p", { className: "text-red-500 text-sm text-center p-2 bg-red-100 dark:bg-red-900/50 rounded-md mb-4" }, itemsError),
      loadingItems ? React.createElement(SwapSpinner, null) :
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