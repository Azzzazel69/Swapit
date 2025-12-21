
import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api.ts';
import { ExchangeStatus } from '../types.ts';
import SwapSpinner from '../components/SwapSpinner.tsx';
import { useAuth } from '../hooks/useAuth.tsx';
import Button from '../components/Button.tsx';
import { ICONS } from '../constants.tsx';
import { useColorTheme } from '../hooks/useColorTheme.tsx';

// Fix: Converted ItemDetailMini to use React.createElement to match project style and resolve prop typing issues
const ItemDetailMini = ({ item, label, theme }: { item: any, label: string, theme: any }) => (
    React.createElement("div", { className: "flex flex-col sm:flex-row gap-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600" },
        React.createElement("div", { className: "flex-shrink-0" },
            React.createElement("img", { 
                src: item.imageUrls?.[0] || 'https://via.placeholder.com/100', 
                alt: item.title, 
                className: "w-20 h-20 object-cover rounded-md shadow-sm border border-gray-200 dark:border-gray-500"
            })
        ),
        React.createElement("div", { className: "flex-grow min-w-0" },
            React.createElement("p", { className: `text-[10px] font-bold uppercase tracking-wider ${theme.textColor} mb-1` }, label),
            React.createElement("h4", { className: "text-sm font-bold text-gray-900 dark:text-white truncate" }, item.title),
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
    const [isExpanded, setIsExpanded] = useState(false);
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

    // Fix: Converted JSX to React.createElement to resolve children requirement errors and key prop issues
    return (
        React.createElement("div", { className: `relative flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all border-2 ${isSelected ? 'border-blue-500' : 'border-transparent'}` },
            React.createElement("div", { className: "flex items-center gap-3 p-4 cursor-pointer", onClick: () => setIsExpanded(!isExpanded) },
                React.createElement("div", { onClick: (e) => e.stopPropagation(), className: "flex-shrink-0" },
                    React.createElement("input", {
                        type: "checkbox",
                        checked: isSelected,
                        onChange: () => onSelect(exchange.id),
                        className: "h-5 w-5 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    })
                ),
                
                React.createElement("div", { className: "flex-grow flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2" },
                    React.createElement("div", { className: "flex-grow" },
                        React.createElement("div", { className: "flex items-center gap-2 mb-1" },
                             React.createElement("span", { className: `px-2 py-0.5 text-[10px] font-bold uppercase rounded-full ${statusColor[exchange.status]}` },
                                statusText[exchange.status]
                            )
                        ),
                        isOwner ? (
                            React.createElement("p", { className: "text-sm" }, React.createElement("strong", null, exchange.requesterName), " quiere tu ", React.createElement("strong", null, exchange.requestedItem.title))
                        ) : (
                            React.createElement("p", { className: "text-sm" }, "Solicitaste ", React.createElement("strong", null, exchange.requestedItem.title), " de ", React.createElement("strong", null, exchange.ownerName))
                        ),
                        React.createElement("p", { className: "text-xs text-gray-500 dark:text-gray-400" }, "Por: ", React.createElement("span", { className: "font-medium italic" }, offeredItemsPreview))
                    ),
                    
                    React.createElement("div", { className: "flex items-center gap-3 self-end sm:self-center" },
                        React.createElement(Link, { 
                            to: `/chat/${exchange.id}`, 
                            className: `p-2 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-colors`,
                            onClick: (e) => e.stopPropagation(),
                            title: "Ir al chat"
                        },
                            ICONS.envelope
                        ),
                        React.createElement("div", { className: `transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}` },
                             React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-5 w-5 text-gray-400", viewBox: "0 0 20 20", fill: "currentColor" },
                                React.createElement("path", { fillRule: "evenodd", d: "M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z", clipRule: "evenodd" })
                            )
                        )
                    )
                )
            ),

            isExpanded && (
                React.createElement("div", { className: "px-4 pb-4 pt-2 border-t border-gray-100 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-900/10 animate-fade-in-up" },
                    React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4 mt-2" },
                        React.createElement("div", null,
                            React.createElement(ItemDetailMini, { 
                                item: exchange.requestedItem, 
                                label: isOwner ? "Tu artículo solicitado" : "Artículo que deseas", 
                                theme: theme
                            })
                        ),
                        React.createElement("div", { className: "space-y-3" },
                            exchange.offeredItems?.map((item: any, idx: number) => (
                                // Fix line 120: Using React.createElement ensures key is handled correctly by React and not as a direct prop
                                React.createElement(ItemDetailMini, { 
                                    key: item.id,
                                    item: item, 
                                    label: isOwner ? `Artículo ofrecido (${idx+1})` : `Tu artículo ofrecido (${idx+1})`,
                                    theme: theme
                                })
                            )),
                            exchange.offeredOtherItems?.map((item: any, idx: number) => (
                                React.createElement("div", { key: idx, className: "p-3 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg" },
                                    React.createElement("p", { className: "text-[10px] font-bold uppercase text-yellow-700 dark:text-yellow-500 mb-1" }, "Otro artículo no listado"),
                                    React.createElement("p", { className: "text-sm italic" }, item.description)
                                )
                            ))
                        )
                    ),
                    React.createElement("div", { className: "mt-4 flex justify-center" },
                        React.createElement(Link, { to: `/chat/${exchange.id}` },
                            // Fix line 136: Providing children explicitly fixes the missing children error
                            React.createElement(Button, { size: "sm", variant: "primary" }, "Abrir Chat y Negociar")
                        )
                    )
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
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchData = useCallback(async (isInitialLoad = false) => {
    if (!user) return;
    try {
      if (isInitialLoad) setLoading(true);
      const allExchanges = await api.getExchanges();
      setIncoming(allExchanges.filter(ex => ex.ownerId === user.id));
      setOutgoing(allExchanges.filter(ex => ex.requesterId === user.id));
      
      const notifs = await (api as any).getNotificationsForUserDev(user.id);
      setNotifications(notifs || []);
      
      if (isInitialLoad) {
          await (api as any).markAllNotificationsReadDev(user.id);
      }
      
      setError(null);
    } catch (err) {
      setError('Error al cargar los intercambios.');
    } finally {
      if (isInitialLoad) setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    let isMounted = true;
    fetchData(true);
    const intervalId = setInterval(() => { if (isMounted) fetchData(false); }, 5000);
    return () => { isMounted = false; clearInterval(intervalId); };
  }, [fetchData]);

  const handleSelect = (exchangeId) => {
    setSelectedIds(prev =>
        prev.includes(exchangeId)
            ? prev.filter(id => id !== exchangeId)
            : [...prev, exchangeId]
    );
  };

  const handleDeleteSelected = async () => {
    if (typeof window !== 'undefined' && window.confirm(`¿Estás seguro de que quieres eliminar ${selectedIds.length} conversación(es)? Esta acción solo las eliminará de tu buzón.`)) {
        setIsDeleting(true);
        try {
            await api.deleteExchanges(selectedIds);
            setSelectedIds([]);
            await fetchData(true);
        } catch (err: any) {
            setError(err.message || 'Error al eliminar las conversaciones.');
        } finally {
            setIsDeleting(false);
        }
    }
  };

  if (loading) {
    return React.createElement("div", { className: "flex justify-center items-center h-64" }, React.createElement(SwapSpinner, null));
  }
  
  if (error) {
    return React.createElement("div", { className: "text-center text-red-500" }, error);
  }

  const renderNotifications = () => {
    if (notifications.length === 0) return null;
    return (
        React.createElement("div", { className: "mb-8" },
            React.createElement("h2", { className: "text-2xl font-semibold mb-4 border-b pb-2 border-gray-300 dark:border-gray-600" }, "Notificaciones Recientes"),
            React.createElement("div", { className: "space-y-3" },
                notifications.map((n: any) => (
                    React.createElement(Link, { 
                        key: n.id,
                        to: n.meta?.type === 'favorite' ? `/user/${n.meta.userId}` : n.meta?.exchangeId ? `/chat/${n.meta.exchangeId}` : '/exchanges',
                        className: "block p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors" 
                    },
                        React.createElement("p", { className: "font-semibold text-blue-800 dark:text-blue-200" }, n.title),
                        React.createElement("p", { className: "text-sm text-gray-700 dark:text-gray-300" }, n.body)
                    )
                ))
            )
        )
    );
  };

  const renderExchangeList = (exchanges: any[], perspective: string) => {
      if (exchanges.length === 0) {
          return React.createElement("p", { className: "text-gray-500 dark:text-gray-400" }, perspective === 'owner' ? "No tienes propuestas recibidas." : "No has enviado propuestas.");
      }
      return (
        React.createElement("div", { className: "space-y-4" },
            exchanges.map(ex => (
                React.createElement(ExchangeCard, { 
                    key: ex.id, 
                    exchange: ex, 
                    perspective: perspective, 
                    isSelected: selectedIds.includes(ex.id),
                    onSelect: handleSelect
                })
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
                // Fix line 262: Explicitly providing children fixes the required children error
                React.createElement(Button, { variant: "danger", onClick: handleDeleteSelected, isLoading: isDeleting }, `Eliminar (${selectedIds.length})`)
            )
        ),
        renderNotifications(),
        React.createElement("div", { className: "space-y-8" },
            React.createElement("section", null,
                React.createElement("h2", { className: "text-2xl font-semibold mb-4 border-b pb-2 border-gray-300 dark:border-gray-600" }, "Propuestas Recibidas"),
                renderExchangeList(incoming, "owner")
            ),
            React.createElement("section", null,
                React.createElement("h2", { className: "text-2xl font-semibold mb-4 border-b pb-2 border-gray-300 dark:border-gray-600" }, "Propuestas Enviadas"),
                renderExchangeList(outgoing, "requester")
            )
        )
    )
  );
};

export default ExchangesPage;
