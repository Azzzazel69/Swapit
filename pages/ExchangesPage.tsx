import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api.ts';
import { ExchangeStatus } from '../types.ts';
import Spinner from '../components/Spinner.tsx';
// FIX: Changed import from useAuth.js to useAuth.tsx
import { useAuth } from '../hooks/useAuth.tsx';
import Button from '../components/Button.tsx';

// FIX: Changed component signature to use props object directly to avoid TypeScript overload resolution issues with React.createElement.
const ExchangeCard = (props) => {
    const { exchange, perspective, isSelected, onSelect } = props;
    const isOwner = perspective === 'owner';
    const statusColor = {
        [ExchangeStatus.Pending]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        [ExchangeStatus.Accepted]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
        [ExchangeStatus.Rejected]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
        [ExchangeStatus.Completed]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    };
    
    const offeredItemsPreview = exchange.offeredItems?.map(item => item.title).join(', ') || 'un artículo';

    const statusText = {
        [ExchangeStatus.Pending]: 'Pendiente',
        [ExchangeStatus.Accepted]: 'Aceptado - Confirmación Pendiente',
        [ExchangeStatus.Rejected]: 'Rechazado',
        [ExchangeStatus.Completed]: 'Completado',
    };


    return React.createElement("div", { className: `relative flex items-center gap-3 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow border-2 ${isSelected ? 'border-blue-500' : 'border-transparent'}` },
        React.createElement("div", { onClick: e => e.stopPropagation() },
            React.createElement("input", {
                type: "checkbox",
                checked: isSelected,
                onChange: () => onSelect(exchange.id),
                className: "h-5 w-5 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
            })
        ),
        React.createElement(Link, { to: `/chat/${exchange.id}`, className: "block flex-grow" },
            React.createElement("div", { className: "flex flex-col sm:flex-row justify-between items-center gap-4" },
                React.createElement("div", { className: "flex-1 text-center sm:text-left" },
                    isOwner ? (
                        React.createElement("p", null, React.createElement("strong", null, exchange.requesterName), " quiere tu ", React.createElement("strong", null, exchange.requestedItem.title))
                    ) : (
                        React.createElement("p", null, "Solicitaste ", React.createElement("strong", null, exchange.requestedItem.title), " de ", React.createElement("strong", null, exchange.ownerName))
                    ),
                    React.createElement("p", { className: "text-sm text-gray-500 dark:text-gray-400" }, "a cambio de: ", React.createElement("strong", null, offeredItemsPreview), ".")
                ),
                React.createElement("div", { className: "flex flex-col items-center gap-2" },
                    React.createElement("span", { className: `px-2 py-1 text-xs font-semibold rounded-full ${statusColor[exchange.status]}` },
                        statusText[exchange.status]
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
  const [error, setError] = useState(null);
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
    
    fetchData(true); // Carga inicial

    const intervalId = setInterval(() => {
        if (isMounted) {
            fetchData(false); // Sondeo para actualizaciones
        }
    }, 5000); // Refresca cada 5 segundos

    return () => {
        isMounted = false;
        clearInterval(intervalId); // Limpia el intervalo al desmontar
    };
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
        } catch (err) {
            setError(err.message || 'Error al eliminar las conversaciones.');
        } finally {
            setIsDeleting(false);
        }
    }
  };

  if (loading) {
    return React.createElement("div", { className: "flex justify-center items-center h-64" }, React.createElement(Spinner, null));
  }
  
  if (error) {
    return React.createElement("div", { className: "text-center text-red-500" }, error);
  }

  const renderNotifications = () => {
    if (notifications.length === 0) {
        return null;
    }

    const NotificationItem = ({ notification }) => {
        const isFavorite = notification.meta?.type === 'favorite';
        const linkTo = isFavorite ? `/user/${notification.meta.userId}` : `/exchanges`;
        
        return (
            React.createElement(Link, { 
                to: linkTo,
                className: "block p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors" 
            },
                React.createElement("p", { className: "font-semibold text-blue-800 dark:text-blue-200" }, notification.title),
                React.createElement("p", { className: "text-sm text-gray-700 dark:text-gray-300" }, notification.body),
                isFavorite && React.createElement("p", { className: "text-xs text-blue-600 dark:text-blue-400 mt-1 font-semibold" }, "Ver sus artículos y proponer un trueque →")
            )
        );
    };
    
    return (
        React.createElement("div", { className: "mb-8" },
            React.createElement("h2", { className: "text-2xl font-semibold mb-4 border-b pb-2 border-gray-300 dark:border-gray-600" }, "Notificaciones Recientes"),
            React.createElement("div", { className: "space-y-3" },
                notifications.map(n => React.createElement(NotificationItem, { key: n.id, notification: n }))
            )
        )
    );
  };

  const renderExchangeList = (exchanges, perspective) => {
      if (exchanges.length === 0) {
          const message = perspective === 'owner' 
              ? "No tienes propuestas de intercambio recibidas."
              : "No has enviado ninguna propuesta de intercambio.";
          return React.createElement("p", { className: "text-gray-500 dark:text-gray-400" }, message);
      }
      return React.createElement("div", { className: "space-y-4" },
          exchanges.map(ex => React.createElement(ExchangeCard, { 
              key: ex.id, 
              exchange: ex, 
              perspective: perspective, 
              isSelected: selectedIds.includes(ex.id),
              onSelect: handleSelect
          }))
      );
  };

  return React.createElement("div", null,
    React.createElement("div", { className: "flex justify-between items-center mb-6" },
        React.createElement("h1", { className: "text-3xl font-bold text-gray-900 dark:text-white" }, "Buzón de Intercambios"),
        selectedIds.length > 0 && React.createElement(Button, {
            variant: "danger",
            onClick: handleDeleteSelected,
            isLoading: isDeleting,
            children: `Eliminar (${selectedIds.length})`
        })
    ),
    renderNotifications(),
    React.createElement("div", { className: "space-y-8" },
      React.createElement("div", null,
        React.createElement("h2", { className: "text-2xl font-semibold mb-4 border-b pb-2 border-gray-300 dark:border-gray-600" }, "Propuestas Recibidas"),
        renderExchangeList(incoming, "owner")
      ),
      React.createElement("div", null,
        React.createElement("h2", { className: "text-2xl font-semibold mb-4 border-b pb-2 border-gray-300 dark:border-gray-600" }, "Propuestas Enviadas"),
        renderExchangeList(outgoing, "requester")
      )
    )
  );
};

export default ExchangesPage;