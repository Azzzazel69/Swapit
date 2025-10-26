import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Item } from '../types';
import Spinner from '../components/Spinner';
import Button from '../components/Button';
import { ICONS } from '../constants';
import { useAuth } from '../hooks/useAuth';

const ImageLightbox: React.FC<{ imageUrl: string; onClose: () => void }> = ({ imageUrl, onClose }) => {
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div className="relative max-w-4xl max-h-4/5 p-4" onClick={e => e.stopPropagation()}>
        <img src={imageUrl} alt="Full screen view" className="max-w-full max-h-[80vh] object-contain" />
        <button onClick={onClose} className="absolute top-4 right-4 text-white hover:text-gray-300">
          {ICONS.close}
        </button>
      </div>
    </div>
  );
};


const ItemDetailPage: React.FC = () => {
  const { itemId } = useParams<{ itemId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    const fetchItem = async () => {
      if (!itemId) {
        setError("ID de artículo no proporcionado.");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const fetchedItem = await api.getItemById(itemId);
        if (fetchedItem) {
          setItem(fetchedItem);
          setSelectedImage(fetchedItem.imageUrls[0]);
        } else {
          setError("Artículo no encontrado.");
        }
      } catch (err) {
        setError("Error al cargar los detalles del artículo.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [itemId]);
  
  const handleSwapClick = () => {
    // This would trigger a modal to select an item to offer
    alert(`Proponiendo un intercambio por ${item?.title}. Por favor, selecciona uno de tus artículos.`);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Spinner /></div>;
  }

  if (error) {
    return <div className="text-center text-red-500">{error}</div>;
  }

  if (!item) {
    return <div className="text-center text-gray-500">No se pudo cargar el artículo.</div>;
  }
  
  const isOwnItem = user?.id === item.userId;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
       {lightboxOpen && selectedImage && <ImageLightbox imageUrl={selectedImage} onClose={() => setLightboxOpen(false)} />}
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:underline mb-4">
        &larr; Volver a los artículos
      </button>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <div className="mb-4">
            <img 
              src={selectedImage || ''} 
              alt={item.title} 
              className="w-full h-auto object-cover rounded-lg shadow-md cursor-pointer"
              onClick={() => setLightboxOpen(true)}
            />
          </div>
          <div className="flex space-x-2 overflow-x-auto">
            {item.imageUrls.map((url, index) => (
              <img
                key={index}
                src={url}
                alt={`${item.title} thumbnail ${index + 1}`}
                className={`w-20 h-20 object-cover rounded-md cursor-pointer border-2 ${selectedImage === url ? 'border-indigo-500' : 'border-transparent hover:border-gray-400'}`}
                onClick={() => setSelectedImage(url)}
              />
            ))}
          </div>
        </div>
        <div className="flex flex-col">
          <span className="bg-indigo-100 text-indigo-800 text-sm font-medium mb-2 px-2.5 py-0.5 rounded-full dark:bg-indigo-900 dark:text-indigo-300 self-start">
            {item.category}
          </span>
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">{item.title}</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6 flex-grow">{item.description}</p>
          
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              <p>Propietario: <strong>{item.ownerName}</strong></p>
              <p>Publicado: {new Date(item.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          {!isOwnItem && (
            <div className="mt-6">
              <Button size="lg" onClick={handleSwapClick} className="w-full">
                <div className="flex items-center gap-2">
                  {ICONS.swap}
                  Proponer Intercambio
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