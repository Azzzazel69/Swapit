
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';
import { Item } from '../types';
import Spinner from '../components/Spinner';
import Button from '../components/Button';
import { ICONS } from '../constants';
import { useAuth } from '../hooks/useAuth';

const ItemDetailPage: React.FC = () => {
  const { itemId } = useParams<{ itemId: string }>();
  const { user } = useAuth();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchItem = async () => {
      if (!itemId) {
        setError("Item ID not provided.");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const fetchedItem = await api.getItemById(itemId);
        if (fetchedItem) {
          setItem(fetchedItem);
        } else {
          setError("Item not found.");
        }
      } catch (err) {
        setError("Failed to fetch item details.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [itemId]);
  
  const handleSwapClick = () => {
    // This would trigger a modal to select an item to offer
    alert(`Proposing a swap for ${item?.title}. Please select one of your items.`);
  };

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

  if (!item) {
    return <div className="text-center text-gray-500">Item could not be loaded.</div>;
  }
  
  const isOwnItem = user?.id === item.userId;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <img src={item.imageUrl} alt={item.title} className="w-full h-auto object-cover rounded-lg shadow-md" />
        </div>
        <div className="flex flex-col">
          <span className="bg-indigo-100 text-indigo-800 text-sm font-medium mb-2 px-2.5 py-0.5 rounded-full dark:bg-indigo-900 dark:text-indigo-300 self-start">
            {item.category}
          </span>
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">{item.title}</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6 flex-grow">{item.description}</p>
          
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              <p>Owner: <strong>{item.ownerName}</strong></p>
              <p>Posted: {new Date(item.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          {!isOwnItem && (
            <div className="mt-6">
              <Button size="lg" onClick={handleSwapClick} className="w-full">
                <div className="flex items-center gap-2">
                  {ICONS.swap}
                  Propose Swap
                </div>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ItemDetailPage;
