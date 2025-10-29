






import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import Spinner from '../components/Spinner.js';
import Button from '../components/Button.js';
import { ICONS } from '../constants.js';
// FIX: Changed import from useAuth.js to useAuth.tsx
import { useAuth } from '../hooks/useAuth.tsx';
import { useColorTheme } from '../hooks/useColorTheme.js';

// FIX: Changed component signature to use a single `props` argument instead of destructuring. This helps TypeScript's type inference and resolves the overload error for `React.createElement` on the inner `div`.
const ImageLightbox = (props) => {
  // FIX: Pass children as a prop to fix React.createElement overload resolution issues.
  return React.createElement("div", 
    { 
      className: "fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50",
      onClick: props.onClose,
      children: React.createElement("div", 
        { 
          className: "relative max-w-4xl max-h-4/5 p-4", 
          onClick: e => e.stopPropagation(),
          children: [
            // FIX: Removed unnecessary key prop that could interfere with type inference.
            React.createElement("img", { src: props.imageUrl, alt: "Full screen view", className: "max-w-full max-h-[80vh] object-contain" }),
            React.createElement("button", 
              { 
                onClick: props.onClose, 
                className: "absolute top-4 right-4 text-white hover:text-gray-300"
              },
              ICONS.close
            )
          ]
        }
      )
    }
  );
};

const ItemDetailPage = () => {
  const { itemId } = useParams();
  const { user } = useAuth();
  const { theme } = useColorTheme();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
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
    alert(`Proponiendo un intercambio por ${item?.title}. Por favor, selecciona uno de tus artículos.`);
  };

  if (loading) {
    return React.createElement("div", { className: "flex justify-center items-center h-64" }, React.createElement(Spinner, null));
  }

  if (error) {
    return React.createElement("div", { className: "text-center text-red-500" }, error);
  }

  if (!item) {
    return React.createElement("div", { className: "text-center text-gray-500" }, "No se pudo cargar el artículo.");
  }
  
  const isOwnItem = user?.id === item.userId;

  return React.createElement("div", { className: "bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl mx-auto p-4 sm:p-6 lg:p-8" },
    lightboxOpen && selectedImage && React.createElement(ImageLightbox, { imageUrl: selectedImage, onClose: () => setLightboxOpen(false) }),
    React.createElement("button", { onClick: () => navigate(-1), className: `flex items-center gap-2 ${theme.textColor} ${theme.hoverTextColor} hover:underline mb-4` },
      "← Volver a los artículos"
    ),
    React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-8" },
      React.createElement("div", null,
        React.createElement("div", { className: "mb-4" },
          React.createElement("img", { 
            src: selectedImage || '', 
            alt: item.title, 
            className: "w-full h-auto object-cover rounded-lg shadow-md cursor-pointer",
            onClick: () => setLightboxOpen(true)
          })
        ),
        React.createElement("div", { className: "flex space-x-2 overflow-x-auto" },
          item.imageUrls.map((url, index) => React.createElement("img", {
              key: index,
              src: url,
              alt: `${item.title} thumbnail ${index + 1}`,
              className: `w-20 h-20 object-cover rounded-md cursor-pointer border-2 ${selectedImage === url ? theme.border : 'border-transparent hover:border-gray-400'}`,
              onClick: () => setSelectedImage(url)
            })
          )
        )
      ),
      React.createElement("div", { className: "flex flex-col" },
        React.createElement("span", { className: `${theme.lightBg} ${theme.darkText} text-sm font-medium mb-2 px-2.5 py-0.5 rounded-full self-start` },
          item.category
        ),
        React.createElement("h1", { className: "text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4" }, item.title),
        React.createElement("p", { className: "text-gray-600 dark:text-gray-300 mb-6 flex-grow" }, item.description),
        
        React.createElement("div", { className: "border-t border-gray-200 dark:border-gray-700 pt-4" },
          React.createElement("div", { className: "text-sm text-gray-500 dark:text-gray-400" },
            React.createElement("p", null, "Propietario: ", React.createElement("strong", null, item.ownerName)),
            React.createElement("p", null, "Publicado: ", new Date(item.createdAt).toLocaleDateString())
          )
        ),
        !isOwnItem && React.createElement("div", { className: "mt-6" },
// FIX: Pass children as a prop to the Button component to satisfy the type checker.
          React.createElement(Button, { size: "lg", onClick: handleSwapClick, className: "w-full", children: React.createElement("div", { className: "flex items-center gap-2" },
              ICONS.swap,
              "Proponer Intercambio"
            )
          })
        )
      )
    )
  );
};

export default ItemDetailPage;