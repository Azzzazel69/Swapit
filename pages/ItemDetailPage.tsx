import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api.js';
import Spinner from '../components/Spinner.js';
import Button from '../components/Button.js';
import { ICONS } from '../constants.js';
// FIX: Changed import from useAuth.js to useAuth.tsx
import { useAuth } from '../hooks/useAuth.tsx';
import { useColorTheme } from '../hooks/useColorTheme.js';
import ExchangeProposalModal from '../components/ExchangeProposalModal.js';

// FIX: Refactored React.createElement calls to pass children as arguments instead of a prop
// to resolve TypeScript overload ambiguity for intrinsic elements like 'div'.
const ImageLightbox = (props) => {
  return React.createElement("div", 
    { 
      className: "fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50",
      onClick: props.onClose
    },
    React.createElement("div", 
      { 
        className: "relative max-w-4xl max-h-4/5 p-4", 
        // FIX: Added type to event object to help TypeScript infer correct element type.
        onClick: (e: React.MouseEvent) => e.stopPropagation()
      },
      React.createElement("img", { src: props.imageUrl, alt: "Full screen view", className: "max-w-full max-h-[80vh] object-contain" }),
      React.createElement("button", 
        { 
          onClick: props.onClose, 
          className: "absolute top-4 right-4 text-white hover:text-gray-300"
        },
        ICONS.close
      )
    )
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userItems, setUserItems] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [noItemsError, setNoItemsError] = useState(false);
  
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
  
  const handleSwapClick = async () => {
    if (!user) return;
    const currentUserItems = await api.getUserItems(user.id);
    const availableItems = currentUserItems.filter(i => i.status === 'AVAILABLE');
    if (availableItems.length === 0) {
      setNoItemsError(true);
      return;
    }
    setUserItems(availableItems);
    setIsModalOpen(true);
  };

  const handleSubmitProposal = async ({ offeredItemIds, message }) => {
      if (!itemId) return;
      setIsSubmitting(true);
      try {
          const newExchange = await api.createExchangeProposal({
              requestedItemId: itemId,
              offeredItemIds,
              message,
          });
          setIsModalOpen(false);
          navigate(`/chat/${newExchange.id}`);
      } catch (err) {
          setError(err.message || 'Error al crear la propuesta.');
      } finally {
          setIsSubmitting(false);
      }
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
  const isSwapped = item.status === 'EXCHANGED';

  return React.createElement("div", { className: "bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl mx-auto p-4 sm:p-6 lg:p-8" },
    lightboxOpen && selectedImage && React.createElement(ImageLightbox, { imageUrl: selectedImage, onClose: () => setLightboxOpen(false) }),
    isModalOpen && React.createElement(ExchangeProposalModal, {
        isOpen: isModalOpen,
        onClose: () => setIsModalOpen(false),
        userItems: userItems,
        targetItem: item,
        onSubmit: handleSubmitProposal,
        isLoading: isSubmitting,
    }),
    noItemsError && React.createElement("div", {
      className: "fixed bottom-5 right-5 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 dark:bg-yellow-900/50 dark:border-yellow-500 dark:text-yellow-200 p-4 rounded-r-lg shadow-lg flex items-start gap-3 z-50 max-w-sm transition-opacity duration-300",
      role: "alert"
    },
      React.createElement("div", { className: "flex-shrink-0 pt-0.5" },
        React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" },
          React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" })
        )
      ),
      React.createElement("div", { className: "flex-grow" },
        React.createElement("p", { className: "font-bold" }, "Necesitas un artículo para intercambiar"),
        React.createElement("p", { className: "text-sm mt-1" }, "Para proponer un intercambio, primero debes añadir un artículo a tu perfil."),
        React.createElement(Link, {
          to: "/my-items?action=add",
          onClick: () => setNoItemsError(false),
          className: `block mt-2 text-sm font-semibold ${theme.textColor} ${theme.hoverTextColor} underline`
        }, "Añadir un artículo ahora →")
      ),
      React.createElement("div", { className: "ml-auto pl-3" },
        React.createElement("button", { 
          onClick: () => setNoItemsError(false), 
          className: "-mx-1.5 -my-1.5 bg-yellow-100 dark:bg-yellow-900/0 text-yellow-500 rounded-lg focus:ring-2 focus:ring-yellow-400 p-1.5 hover:bg-yellow-200 dark:hover:bg-yellow-800/50 inline-flex h-8 w-8",
          "aria-label":"Cerrar"
        },
          React.createElement("span", { className: "sr-only" }, "Cerrar"),
          React.createElement("svg", { className: "h-5 w-5", xmlns: "http://www.w3.org/2000/svg", fill: "currentColor", viewBox: "0 0 20 20" },
            React.createElement("path", { fillRule:"evenodd", d:"M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z", clipRule:"evenodd" })
          )
        )
      )
    ),
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
        !isOwnItem && (
          isSwapped ? (
            React.createElement("div", { className: "mt-6 text-center p-4 bg-gray-100 dark:bg-gray-700 rounded-lg" },
              React.createElement("p", { className: "font-semibold text-gray-700 dark:text-gray-200" }, "Este artículo ya ha sido intercambiado.")
            )
          ) : (
            React.createElement("div", { className: "mt-6" },
              React.createElement(Button, { size: "lg", onClick: handleSwapClick, className: "w-full", children: React.createElement("div", { className: "flex items-center justify-center gap-2" },
                  ICONS.swap,
                  "!te lo cambio!"
                )
              })
            )
          )
        )
      )
    )
  );
};

export default ItemDetailPage;