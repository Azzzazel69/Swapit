import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../services/api';
import { Item } from '../types';
import ItemCard from '../components/ItemCard';
import Spinner from '../components/Spinner';
import { useAuth } from '../hooks/useAuth';

const HomePage: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'recommended'>('all');
  const { user } = useAuth();

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        const allItems = await api.getAllItems();
        const otherUsersItems = allItems.filter(item => item.userId !== user?.id);
        setItems(otherUsersItems);
        setError(null);
      } catch (err) {
        setError('Error al cargar los artículos. Por favor, inténtalo de nuevo más tarde.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
        fetchItems();
    }
  }, [user]);

  const filteredItems = useMemo(() => {
    if (filter === 'recommended' && user?.preferences?.length) {
      return items.filter(item => user.preferences.includes(item.category));
    }
    return items;
  }, [items, filter, user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-500">{error}</div>;
  }
  
  const FilterButton: React.FC<{ type: 'all' | 'recommended', label: string }> = ({ type, label }) => (
    <button 
      onClick={() => setFilter(type)}
      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${filter === type ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
    >
      {label}
    </button>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Artículos Disponibles para Intercambiar</h1>
        <div className="flex items-center gap-2">
          <FilterButton type="all" label="Todos los Artículos" />
          <FilterButton type="recommended" label="Recomendado para Ti" />
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400 mt-10">
          {filter === 'recommended' 
            ? "No hay artículos que coincidan con tus preferencias. ¡Intenta ajustar tus intereses en tu perfil!" 
            : "No hay artículos disponibles de otros usuarios en este momento."}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredItems.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
};

export default HomePage;