import React from 'react';
import { Item } from '../types';
import { Link } from 'react-router-dom';

interface ItemCardProps {
  item: Item;
  isOwnItem?: boolean;
}

const ItemCard: React.FC<ItemCardProps> = ({ item, isOwnItem = false }) => {
  return (
    <Link to={`/item/${item.id}`} className="block bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-1 transition-transform duration-300 group">
      <div className="relative">
        <img className="w-full h-56 object-cover object-center" src={item.imageUrls[0]} alt={item.title} />
        <div className="absolute top-2 left-2 bg-indigo-500 text-white text-xs font-bold px-2 py-1 rounded-full">{item.category}</div>
        {item.imageUrls.length > 1 && (
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <span>{item.imageUrls.length}</span>
          </div>
        )}
      </div>
      <div className="p-6">
        <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white truncate group-hover:text-indigo-500 transition-colors">{item.title}</h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3 h-16">{item.description}</p>
        <div className="flex items-center justify-between mt-auto">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            <p>Propietario: <strong>{isOwnItem ? 'Tú' : item.ownerName}</strong></p>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ItemCard;