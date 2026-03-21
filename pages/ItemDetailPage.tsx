
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api, viewHistoryService } from '../services/api.ts';
import Button from '../components/Button.tsx';
import { ICONS } from '../constants.tsx';
import { useAuth } from '../hooks/useAuth.tsx';
import { useColorTheme } from '../hooks/useColorTheme.tsx';
import { useToast } from '../hooks/useToast.tsx';
import { ItemCondition } from '../types.ts';
import ExchangeProposalModal from '../components/ExchangeProposalModal.tsx';
import EditItemModal from '../components/EditItemModal.tsx';
import ItemDetailSkeleton from '../components/ItemDetailSkeleton.tsx';
import ReportModal from '../components/ReportModal.tsx';

const ItemDetailPage = () => {
  const { itemId } = useParams();
  const { user } = useAuth();
  const { theme } = useColorTheme();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userItems, setUserItems] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        setLoading(true);
        const fetched = await api.getItemById(itemId);
        if (fetched) {
          setItem(fetched);
          setSelectedImage(fetched.imageUrls[0]);
          viewHistoryService.addItem(fetched);
        }
      } catch (err) { showToast("Error al cargar detalles", "error"); }
      finally { setLoading(false); }
    };
    fetchItem();
  }, [itemId]);
  
  const handleSwapClick = async () => {
    if (!user) return;
    const items = await api.getUserItems(user.id);
    const available = items.filter(i => i.status === 'AVAILABLE');
    if (available.length === 0) {
      showToast("Primero debes subir un artículo para poder intercambiar.", "error");
      return;
    }
    setUserItems(available);
    setIsModalOpen(true);
  };

  const handleSubmitProposal = async ({ offeredItemIds, message }) => {
      setIsSubmitting(true);
      try {
          const res = await api.createExchangeProposal({ requestedItemId: item.id, offeredItemIds, message });
          navigate(`/chat/${res.id}`);
      } catch (err) { showToast(err.message, "error"); }
      finally { setIsSubmitting(false); }
  };

  if (loading) return React.createElement(ItemDetailSkeleton, null);
  if (!item) return React.createElement("div", { className: "text-center p-10" }, "Artículo no encontrado.");

  const isOwnItem = user?.id === item.userId;

  return React.createElement("div", { className: "max-w-4xl mx-auto px-4 py-6" },
    React.createElement(EditItemModal, { isOpen: isEditModalOpen, onClose: () => setIsEditModalOpen(false), item: item, onSave: (d) => api.updateItem(item.id, d).then(setItem) }),
    React.createElement(ReportModal, { 
      isOpen: isReportModalOpen, 
      onClose: () => setIsReportModalOpen(false), 
      title: "Reportar Artículo", 
      type: "ITEM", 
      onSubmit: async (r) => {
        try {
          await api.reportContent(item.id, 'ITEM', r);
          showToast("Reporte enviado", "success");
        } catch (err) {
          showToast("Error al enviar reporte", "error");
        }
      } 
    }),
    React.createElement(ExchangeProposalModal, { isOpen: isModalOpen, onClose: () => setIsModalOpen(false), userItems: userItems, targetItem: item, onSubmit: handleSubmitProposal, isLoading: isSubmitting }),
    
    // Barra de navegación superior con botón Volver
    React.createElement("div", { className: "mb-6 flex items-center justify-between" },
        React.createElement("button", { 
            onClick: () => navigate(-1),
            className: `flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all active:scale-95 group`
        },
            React.createElement("svg", { 
                xmlns: "http://www.w3.org/2000/svg", 
                className: `h-5 w-5 ${theme.textColor} group-hover:-translate-x-1 transition-transform`, 
                fill: "none", 
                viewBox: "0 0 24 24", 
                stroke: "currentColor", 
                strokeWidth: "3" 
            },
                React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M10 19l-7-7m0 0l7-7m-7 7h18" })
            ),
            React.createElement("span", { className: "text-sm font-black text-gray-700 dark:text-gray-200" }, "Volver")
        ),
        !isOwnItem && React.createElement("button", {
            onClick: () => setIsReportModalOpen(true),
            className: "text-xs font-bold text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1"
        }, React.createElement("span", null, "🚩"), "Reportar")
    ),

    React.createElement("div", { className: "bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700" },
        React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2" },
            // Galería
            React.createElement("div", { className: "p-4 bg-gray-50 dark:bg-gray-900/50" },
                React.createElement("img", { src: selectedImage, className: "w-full aspect-square object-cover rounded-2xl shadow-lg mb-4" }),
                React.createElement("div", { className: "flex gap-2 overflow-x-auto pb-2 scrollbar-hide" },
                    item.imageUrls.map((u, i) => React.createElement("img", { key: i, src: u, onClick: () => setSelectedImage(u), className: `w-20 h-20 rounded-xl object-cover cursor-pointer border-4 transition-all ${selectedImage === u ? theme.border : 'border-transparent opacity-60 hover:opacity-100'}` }))
                )
            ),
            // Info
            React.createElement("div", { className: "p-8 flex flex-col" },
                React.createElement("div", { className: "flex justify-between items-start mb-4" },
                    React.createElement("div", null,
                        React.createElement("span", { className: "text-[10px] font-black uppercase text-blue-500 tracking-widest" }, item.category),
                        React.createElement("h1", { className: "text-3xl font-black text-gray-900 dark:text-white leading-tight" }, item.title)
                    ),
                    !isOwnItem && React.createElement("button", { onClick: () => api.toggleFavorite(item.id).then(setItem), className: "p-3 rounded-2xl bg-gray-100 dark:bg-gray-700 hover:scale-110 transition-transform shadow-sm" }, item.isFavorited ? "❤️" : "🤍")
                ),
                
                React.createElement("p", { className: "text-gray-600 dark:text-gray-300 mb-4 text-lg" }, item.description),
                
                // SECCIÓN "BUSCO"
                item.wishedItem && React.createElement("div", { className: "mb-8 p-4 bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-500 rounded-r-xl" },
                    React.createElement("h4", { className: "text-[10px] font-black uppercase text-orange-600 dark:text-orange-400 tracking-widest mb-1" }, "Lo que busco a cambio"),
                    React.createElement("p", { className: "text-xl font-black text-gray-800 dark:text-gray-100 italic" }, `"${item.wishedItem}"`)
                ),
                
                // INDICADOR DE UBICACIÓN (CRÍTICO)
                React.createElement("div", { className: "bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-5 rounded-2xl border-2 border-blue-100 dark:border-blue-800 mb-8 flex items-center gap-5 relative overflow-hidden" },
                    React.createElement("div", { className: "absolute top-0 right-0 p-2 opacity-10" }, React.createElement("span", { className: "text-6xl" }, "📍")),
                    React.createElement("div", { className: "w-12 h-12 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-md flex-shrink-0" },
                        React.createElement("span", { className: "text-2xl" }, "📍")
                    ),
                    React.createElement("div", null,
                        React.createElement("h4", { className: "text-[11px] font-black uppercase text-blue-600 dark:text-blue-400 tracking-tighter" }, "Disponible para intercambio en"),
                        React.createElement("p", { className: "text-xl font-black text-gray-800 dark:text-gray-100" }, `${item.ownerLocation.city}`),
                        React.createElement("p", { className: "text-sm font-bold text-blue-500/70" }, `${item.ownerLocation.province}, España`)
                    )
                ),

                React.createElement("div", { className: "mt-auto pt-8 border-t-2 border-gray-100 dark:border-gray-700" },
                    React.createElement("div", { className: "flex flex-col sm:flex-row items-center justify-between gap-4" },
                        React.createElement(Link, { to: `/user/${item.ownerId || item.userId}`, className: "flex items-center gap-3 group w-full sm:w-auto" },
                            React.createElement("img", { src: item.ownerAvatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + (item.ownerId || 'default'), className: "w-12 h-12 rounded-full border-2 border-white dark:border-gray-600 shadow-md group-hover:scale-105 transition-transform" }),
                            React.createElement("div", null,
                                React.createElement("p", { className: "text-[10px] font-bold text-gray-400 uppercase" }, "Propietario"),
                                React.createElement("div", { className: "flex items-center gap-2" },
                                    React.createElement("p", { className: "font-black group-hover:text-blue-500 transition-colors" }, item.ownerName || 'Usuario'),
                                    (item.ownerRating || 0) > 0 && React.createElement("div", { className: "flex items-center gap-1 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded-md" },
                                        React.createElement("span", { className: "text-[10px]" }, "⭐"),
                                        React.createElement("span", { className: "text-xs font-black text-gray-700 dark:text-gray-300" }, item.ownerRating)
                                    )
                                )
                            )
                        ),
                        isOwnItem ? 
                        React.createElement(Button, { onClick: () => setIsEditModalOpen(true), variant: "secondary", className: "rounded-xl px-8 w-full sm:w-auto", children: "Editar" }) :
                        React.createElement(Button, { onClick: handleSwapClick, className: "rounded-xl px-10 shadow-lg w-full sm:w-auto", children: "¡Te lo cambio!" })
                    )
                )
            )
        )
    )
  );
};

export default ItemDetailPage;
