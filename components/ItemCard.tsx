
import React from 'react';
import { Item } from '../types';
import { Link } from 'react-router-dom';

interface ItemCardProps {
  item: Item;
  isOwnItem?: boolean;
}

const ItemCard: React.FC<ItemCardProps> = ({ item, isOwnItem = false }) => {
  return (
    <Link to={`/item/${item.id}`} className="block bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-1 transition-transform duration-300">
      <div className="relative">
        <img className="w-full h-56 object-cover object-center" src={item.imageUrl} alt={item.title} />
        <div className="absolute top-2 left-2 bg-indigo-500 text-white text-xs font-bold px-2 py-1 rounded-full">{item.category}</div>
      </div>
      <div className="p-6">
        <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white truncate">{item.title}</h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3 h-16">{item.description}</p>
        <div className="flex items-center justify-between mt-auto">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            <p>Owner: <strong>{isOwnItem ? 'You' : item.ownerName}</strong></p>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ItemCard;
