

import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../services/api.js';
import ItemCard from '../components/ItemCard.js';
import Spinner from '../components/Spinner.js';
import Button from '../components/Button.js';
import Input from '../components/Input.js';
import { ICONS, CATEGORIES } from '../constants.js';
// FIX: Changed import from useAuth.js to useAuth.tsx
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
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!category) {
        setError('Por favor, selecciona una categoría.');
        return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await api.createItem({ title, description, category });
      setTitle('');
      setDescription('');
      setCategory('');
      setShowForm(false);
      await fetchUserItems(); // Refresh list
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
// FIX: Pass children as a prop to the Button component to satisfy the type checker.
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
        error && React.createElement("p", { className: "text-red-500 text-sm text-center" }, error),
        React.createElement(Input, { id: "title", label: "Título", type: "text", value: title, onChange: e => setTitle(e.target.value), required: true }),
        React.createElement("div", null,
          React.createElement("label", { htmlFor: "description", className: "block text-sm font-medium text-gray-700 dark:text-gray-300" }, "Descripción"),
// FIX: Used value prop for controlled component instead of passing children to textarea.
          React.createElement("textarea", { id: "description", value: description, onChange: e => setDescription(e.target.value), required: true, rows: 4, className: `mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 ${theme.focus} focus:${theme.border} sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100` })
        ),
        React.createElement("div", null,
          React.createElement("label", { htmlFor: "category", className: "block text-sm font-medium text-gray-700 dark:text-gray-300" }, "Categoría"),
// FIX: Passed options as children arguments to the select element instead of a prop.
// FIX: Combined children into a single array to resolve TS type inference issues with React.createElement.
          React.createElement("select", { id: "category", value: category, onChange: e => setCategory(e.target.value), required: true, className: `mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 ${theme.focus} focus:${theme.border} sm:text-sm rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100` },
            [React.createElement("option", { value: "", disabled: true, key: "disabled" }, "-- Selecciona una Categoría --")]
            .concat(CATEGORIES.map(cat => React.createElement("option", { key: cat, value: cat }, cat)))
          )
        ),
        React.createElement("div", { className: "flex justify-end" },
// FIX: Pass children as a prop to the Button component to satisfy the type checker.
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
    )
  );
};

export default MyItemsPage;
