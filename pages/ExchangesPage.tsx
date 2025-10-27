

import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../services/api.js';
import { ExchangeStatus } from '../types.js';
import Spinner from '../components/Spinner.js';
// FIX: Changed import from useAuth.js to useAuth.tsx
import { useAuth } from '../hooks/useAuth.tsx';
import Button from '../components/Button.js';

const ExchangeCard = ({ exchange, perspective, onAccept, onReject, isUpdating }) => {
    const isOwner = perspective === 'owner';
    const statusColor = {
        [ExchangeStatus.Pending]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        [ExchangeStatus.Accepted]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        [ExchangeStatus.Rejected]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
        [ExchangeStatus.Completed]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    };

    return React.createElement("div", { className: "bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 flex flex-col sm:flex-row justify-between items-center gap-4" },
        React.createElement("div", { className: "flex-1 text-center sm:text-left" },
            isOwner ? (
                React.createElement("p", null, React.createElement("strong", null, exchange.requesterName), " quiere tu ", React.createElement("strong", null, exchange.requestedItem.title))
            ) : (
                React.createElement("p", null, "Solicitaste ", React.createElement("strong", null, exchange.requestedItem.title), " de ", React.createElement("strong", null, exchange.ownerName))
            ),
            React.createElement("p", { className: "text-sm text-gray-500 dark:text-gray-400" }, "a cambio de tu ", React.createElement("strong", null, exchange.offeredItem.title), ".")
        ),
        React.createElement("div", { className: "flex flex-col items-center gap-2" },
            React.createElement("span", { className: `px-2 py-1 text-xs font-semibold rounded-full ${statusColor[exchange.status]}` },
                exchange.status
            ),
            isOwner && exchange.status === ExchangeStatus.Pending && (
                React.createElement("div", { className: "flex gap-2 mt-2" },
// FIX: Pass children as a prop to the Button component to satisfy the type checker.
                    React.createElement(Button, { size: "sm", variant: "primary", onClick: () => onAccept(exchange.id), isLoading: isUpdating, children: "Aceptar" }),
// FIX: Pass children as a prop to the Button component to satisfy the type checker.
                    React.createElement(Button, { size: "sm", variant: "danger", onClick: () => onReject(exchange.id), isLoading: isUpdating, children: "Rechazar" })
                )
            )
        )
    );
};

const ExchangesPage = () => {
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingExchangeId, setUpdatingExchangeId] = useState(null);
  const { user } = useAuth();

  const fetchExchanges = useCallback(async () => {
    if (!user) return;
    try {
      if (loading) setLoading(true); 
      const allExchanges = await api.getExchanges();
      setIncoming(allExchanges.filter(ex => ex.ownerId === user.id));
      setOutgoing(allExchanges.filter(ex => ex.requesterId === user.id));
      setError(null);
    } catch (err) {
      setError('Error al cargar los intercambios.');
    } finally {
      setLoading(false);
    }
  }, [user, loading]);

  useEffect(() => {
    fetchExchanges();
  }, [fetchExchanges]);

  const handleUpdateStatus = async (exchangeId, status) => {
    setUpdatingExchangeId(exchangeId);
    try {
        await api.updateExchangeStatus(exchangeId, status);
        await fetchExchanges();
    } catch (err) {
        setError(err.message || `Error al actualizar el estado del intercambio.`);
    } finally {
        setUpdatingExchangeId(null);
    }
  };

  if (loading) {
    return React.createElement("div", { className: "flex justify-center items-center h-64" }, React.createElement(Spinner, null));
  }
  
  if (error) {
    return React.createElement("div", { className: "text-center text-red-500" }, error);
  }

  return React.createElement("div", null,
    React.createElement("h1", { className: "text-3xl font-bold mb-6 text-gray-900 dark:text-white" }, "Mis Intercambios"),
    React.createElement("div", { className: "space-y-8" },
      React.createElement("div", null,
        React.createElement("h2", { className: "text-2xl font-semibold mb-4 border-b pb-2 border-gray-300 dark:border-gray-600" }, "Solicitudes Entrantes"),
        incoming.length > 0 ? (
          React.createElement("div", { className: "space-y-4" },
            incoming.map(ex => React.createElement(ExchangeCard, { 
                key: ex.id, 
                exchange: ex, 
                perspective: "owner", 
                onAccept: (id) => handleUpdateStatus(id, ExchangeStatus.Accepted),
                onReject: (id) => handleUpdateStatus(id, ExchangeStatus.Rejected),
                isUpdating: updatingExchangeId === ex.id
            }))
          )
        ) : (
          React.createElement("p", { className: "text-gray-500 dark:text-gray-400" }, "No tienes solicitudes de intercambio entrantes.")
        )
      ),
      React.createElement("div", null,
        React.createElement("h2", { className: "text-2xl font-semibold mb-4 border-b pb-2 border-gray-300 dark:border-gray-600" }, "Solicitudes Salientes"),
        outgoing.length > 0 ? (
          React.createElement("div", { className: "space-y-4" },
            outgoing.map(ex => React.createElement(ExchangeCard, { 
                key: ex.id, 
                exchange: ex, 
                perspective: "requester",
                onAccept: () => {}, 
                onReject: () => {},
                isUpdating: false 
            }))
          )
        ) : (
          React.createElement("p", { className: "text-gray-500 dark:text-gray-400" }, "No has realizado ninguna solicitud de intercambio.")
        )
      )
    )
  );
};

export default ExchangesPage;
