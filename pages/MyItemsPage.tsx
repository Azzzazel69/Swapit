import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../services/api';
import { Item } from '../types';
import ItemCard from '../components/ItemCard';
import Spinner from '../components/Spinner';
import Button from '../components/Button';
import Input from '../components/Input';
import { ICONS, CATEGORIES } from '../constants';
import { useAuth } from '../hooks/useAuth';

const MyItemsPage: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const shouldShowForm = queryParams.get('action') === 'add';

  const [showForm, setShowForm] = useState(shouldShowForm);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user } = useAuth();

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
    // This effect ensures the form opens if the user navigates here with the query param
    const params = new URLSearchParams(location.search);
    if (params.get('action') === 'add') {
      setShowForm(true);
    }
  }, [location.search]);

  const handleAddItem = async (e: React.FormEvent) => {
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
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mis Artículos</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          <div className="flex items-center gap-2">
            {ICONS.plus}
            {showForm ? 'Cancelar' : 'Añadir Nuevo Artículo'}
          </div>
        </Button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8">
          <form onSubmit={handleAddItem} className="space-y-4">
            <h2 className="text-xl font-semibold">Detalles del Nuevo Artículo</h2>
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <Input id="title" label="Título" type="text" value={title} onChange={e => setTitle(e.target.value)} required />
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descripción</label>
              <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} required rows={4} className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"></textarea>
            </div>
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Categoría</label>
              <select id="category" value={category} onChange={e => setCategory(e.target.value)} required className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                <option value="" disabled>-- Selecciona una Categoría --</option>
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div className="flex justify-end">
              <Button type="submit" isLoading={isSubmitting}>Añadir Artículo</Button>
            </div>
          </form>
        </div>
      )}

      {items.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400">Aún no has añadido ningún artículo.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} isOwnItem={true} />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyItemsPage;