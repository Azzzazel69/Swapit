
import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api.ts';
import { ExchangeStatus } from '../types.ts';
import SwapSpinner from '../components/SwapSpinner.tsx';
import { useAuth } from '../hooks/useAuth.tsx';
import Button from '../components/Button.tsx';
import { ICONS } from '../constants.tsx';
import { useColorTheme } from '../hooks/useColorTheme.tsx';
import AdBanner from '../components/AdBanner.tsx';

// Fix: Converted ItemDetailMini to use React.createElement to match project style and resolve prop typing issues
const ItemDetailMini = ({ item, label, theme }: { item: any, label: string, theme: any }) => (
    React.createElement("div", { className: "flex flex-col sm:flex-row gap-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600" },
        React.createElement("div", { className: "flex-shrink-0" },
            React.createElement("img", { 
                src: item?.imageUrls?.[0] || 'https://via.placeholder.com/100', 
                alt: item?.title || 'Artículo', 
                className: "w-20 h-20 object-cover rounded-md shadow-sm border border-gray-200 dark:border-gray-500"
            })
        ),
        React.createElement("div", { className: "flex-grow min-w-0" },
            React.createElement("p", { className: `text-[10px] font-bold uppercase tracking-wider ${theme.textColor} mb-1` }, label),
            React.createElement("h4", { className: "text-sm font-bold text-gray-900 dark:text-white truncate" }, item?.title || 'Artículo'),
            React.createElement("p", { className: "text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mt-1 italic" },
                item.description || "Sin descripción disponible."
            ),
            React.createElement(Link, { 
                to: `/item/${item.id}`, 
                className: `inline-block mt-2 text-[10px] font-bold underline ${theme.textColor} hover:opacity-80`,
                onClick: (e) => e.stopPropagation()
            }, "Ver ficha completa")
        )
    )
);

const ExchangeCard = (props: any) => {
    const { exchange, perspective, isSelected, onSelect } = props;
    const { theme } = useColorTheme();
    const isOwner = perspective === 'owner';
    
    const statusColor = {
        [ExchangeStatus.Pending]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        [ExchangeStatus.Accepted]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
        [ExchangeStatus.Rejected]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
        [ExchangeStatus.Completed]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        [ExchangeStatus.Cancelled]: 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200',
    };
    
    const statusText = {
        [ExchangeStatus.Pending]: 'Pendiente',
        [ExchangeStatus.Accepted]: 'Aceptado',
        [ExchangeStatus.Rejected]: 'Rechazado',
        [ExchangeStatus.Completed]: 'Completado',
        [ExchangeStatus.Cancelled]: 'Cancelado',
    };

    const offeredItemsPreview = exchange.offeredItems?.map((item: any) => item.title).join(', ') || 'un artículo';
    const partnerName = isOwner ? exchange.requesterName : exchange.ownerName;

    return (
        React.createElement("div", { className: `relative flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-all border-2 ${isSelected ? 'border-blue-500' : 'border-transparent'}` },
            React.createElement(Link, { className: "flex items-center gap-3 p-4 select-none", to: `/chat/${exchange.id}` },
                React.createElement("div" as any, { onClick: (e: any) => { e.preventDefault(); e.stopPropagation(); onSelect(exchange.id); }, className: "flex-shrink-0" },
                    React.createElement("input", {
                        type: "checkbox",
                        checked: isSelected,
                        onChange: () => {},
                        className: "h-5 w-5 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    })
                ),
                
                React.createElement("div", { className: "w-12 h-12 flex-shrink-0 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xl overflow-hidden" },
                    exchange.status === ExchangeStatus.Pending && isOwner ? "✋" : "👤"
                ),

                React.createElement("div", { className: "flex-grow flex flex-col justify-center min-w-0" },
                    React.createElement("div", { className: "flex items-center justify-between mb-1" },
                        React.createElement("h3", { className: "font-bold text-gray-900 dark:text-white truncate" }, partnerName),
                        React.createElement("span", { className: `flex-shrink-0 px-2 py-0.5 text-[10px] font-bold uppercase rounded-full ${statusColor[exchange.status]}` },
                            statusText[exchange.status]
                        )
                    ),
                    exchange.status === ExchangeStatus.Pending && isOwner ? (
                        React.createElement("p", { className: "text-xs font-semibold text-blue-600 dark:text-blue-400 truncate" }, "¡Nueva propuesta de intercambio!")
                    ) : (
                        React.createElement("p", { className: "text-sm text-gray-600 dark:text-gray-400 truncate" }, exchange.lastMessage || (isOwner ? "Solicitud recibida" : "Propuesta enviada"))
                    ),
                    React.createElement("p", { className: "text-[10px] text-gray-400 uppercase font-black truncate mt-1" }, 
                        isOwner ? `Por tu: ${exchange.requestedItem?.title || 'Artículo'}` : `Quieres su: ${exchange.requestedItem?.title || 'Artículo'}`
                    )
                ),
                
                React.createElement("div", { className: "flex items-center gap-3 flex-shrink-0 opacity-50 group-hover:opacity-100" },
                    React.createElement("div", { 
                        className: `p-2 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400`,
                        title: "Ir al chat"
                    }, ICONS.envelope )
                )
            )
        )
    );
};

const ExchangesPage = () => {
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      await (api as any).markAllNotificationsReadDev(user.id);
      setError(null);
    } catch (err) {
      setError('Error al cargar notificaciones.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
    if (!user) return;
    const unsubExchanges = api.subscribeToExchanges((allExchanges) => {
      setIncoming(allExchanges.filter(ex => ex.ownerId === user.id));
      setOutgoing(allExchanges.filter(ex => ex.requesterId === user.id));
    });
    const unsubNotifications = api.subscribeToNotifications(user.id, (notifs) => {
      setNotifications(notifs || []);
    });
    return () => {
      unsubExchanges();
      unsubNotifications();
    };
  }, [fetchData, user]);

  const handleSelect = (exchangeId) => {
    setSelectedIds(prev =>
        prev.includes(exchangeId)
            ? prev.filter(id => id !== exchangeId)
            : [...prev, exchangeId]
    );
  };

  const handleDeleteSelected = async () => {
    setIsConfirmDeleteOpen(true);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
        await api.deleteExchanges(selectedIds);
        setSelectedIds([]);
    } catch (err: any) {
        setError(err.message || 'Error al eliminar las conversaciones.');
    } finally {
        setIsDeleting(false);
        setIsConfirmDeleteOpen(false);
    }
  };

  if (loading) {
    return React.createElement("div", { className: "flex justify-center items-center h-64" }, React.createElement(SwapSpinner, null));
  }
  
  if (error) {
    return React.createElement("div", { className: "text-center text-red-500" }, error);
  }


  const renderExchangeList = (exchanges: any[], perspective: string) => {
      if (exchanges.length === 0) {
          return React.createElement("p", { className: "text-gray-500 dark:text-gray-400" }, perspective === 'owner' ? "No tienes propuestas recibidas." : "No has enviado propuestas.");
      }
      return (
        React.createElement("div", { className: "space-y-4" },
            exchanges.map((ex, index) => (
                React.createElement(React.Fragment, { key: ex.id },
                    React.createElement(ExchangeCard, { 
                        exchange: ex, 
                        perspective: perspective, 
                        isSelected: selectedIds.includes(ex.id),
                        onSelect: handleSelect
                    }),
                    index > 0 && (index + 1) % 5 === 0 && (
                        React.createElement(AdBanner, { adSlot: `exchange-ad-${index}` })
                    )
                )
            ))
        )
      );
  };

  // Fix: Converted main ExchangesPage return to use React.createElement for consistency
  return (
    React.createElement("div", null,
        React.createElement("div", { className: "flex justify-between items-center mb-6" },
            React.createElement("h1", { className: "text-3xl font-bold text-gray-900 dark:text-white" }, "Buzón de Intercambios"),
            selectedIds.length > 0 && (
                React.createElement(Button, { variant: "danger", onClick: handleDeleteSelected, isLoading: isDeleting }, `Eliminar (${selectedIds.length})`)
            )
        ),
        React.createElement("div", { className: "space-y-8" },
            React.createElement("section", null,
                React.createElement("h2", { className: "text-2xl font-semibold mb-4 border-b pb-2 border-gray-300 dark:border-gray-600" }, "Propuestas Recibidas"),
                renderExchangeList(incoming, "owner")
            ),
            React.createElement("section", null,
                React.createElement("h2", { className: "text-2xl font-semibold mb-4 border-b pb-2 border-gray-300 dark:border-gray-600" }, "Propuestas Enviadas"),
                renderExchangeList(outgoing, "requester")
            )
        ),
      
      isConfirmDeleteOpen && React.createElement("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" },
        React.createElement("div", { className: "bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200" },
            React.createElement("div", { className: "flex justify-between items-center mb-4" },
                React.createElement("h2", { className: "text-xl font-bold text-gray-900 dark:text-white" }, "Eliminar Conversaciones"),
                React.createElement("button", { onClick: () => setIsConfirmDeleteOpen(false), className: "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300" },
                    React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" },
                        React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M6 18L18 6M6 6l12 12" })
                    )
                )
            ),
            React.createElement("p", { className: "text-gray-600 dark:text-gray-400 mb-6" }, `¿Estás seguro de que quieres eliminar ${selectedIds.length} conversación(es)? Esta acción solo las eliminará de tu buzón.`),
            React.createElement("div", { className: "flex justify-end gap-3" },
                React.createElement(Button, { variant: "secondary", onClick: () => setIsConfirmDeleteOpen(false), children: "Cancelar" }),
                React.createElement(Button, { variant: "danger", onClick: confirmDelete, isLoading: isDeleting, children: "Eliminar" })
            )
        )
      )
    )
  );
};

export default ExchangesPage;
