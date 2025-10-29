import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api.js';
import { ExchangeStatus } from '../types.js';
import Spinner from '../components/Spinner.js';
// FIX: Changed import from useAuth.js to useAuth.tsx
import { useAuth } from '../hooks/useAuth.tsx';
import Button from '../components/Button.js';

// FIX: Changed component signature to use props object directly to avoid TypeScript overload resolution issues with React.createElement.
const ExchangeCard = (props) => {
    const { exchange, perspective, onAccept, onReject, onVote, isUpdating } = props;
    const isOwner = perspective === 'owner';
    const statusColor = {
        [ExchangeStatus.Pending]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        [ExchangeStatus.Accepted]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        [ExchangeStatus.Rejected]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
        [ExchangeStatus.Completed]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    };
    
    const offeredItemsPreview = exchange.offeredItems?.map(item => item.title).join(', ') || 'un artículo';

    const canVote = (isOwner && !exchange.votedByOwner) || (!isOwner && !exchange.votedByRequester);
    const hasVoted = (isOwner && exchange.votedByOwner) || (!isOwner && exchange.votedByRequester);

    return React.createElement(Link, { to: `/chat/${exchange.id}`, className: "block bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow" },
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
                exchange.status
            ),
            isOwner && exchange.status === ExchangeStatus.Pending && (
                // FIX: Added type to event object to help TypeScript infer correct element type.
                React.createElement("div", { className: "flex gap-2 mt-2", onClick: (e: React.MouseEvent) => e.preventDefault() },
// FIX: Pass children as a prop to the Button component to satisfy the type checker.
                    React.createElement(Button, { size: "sm", variant: "primary", onClick: () => onAccept(exchange.id), isLoading: isUpdating, children: "Aceptar" }),
// FIX: Pass children as a prop to the Button component to satisfy the type checker.
                    React.createElement(Button, { size: "sm", variant: "danger", onClick: () => onReject(exchange.id), isLoading: isUpdating, children: "Rechazar" })
                )
            ),
            exchange.status === ExchangeStatus.Accepted && (
                React.createElement("div", { className: "flex items-center gap-2 mt-2", onClick: (e) => e.preventDefault() },
                    canVote && React.createElement(Button, { size: "sm", variant: "secondary", onClick: () => onVote(exchange.id), isLoading: isUpdating, children: "Valorar Trueque" }),
                    hasVoted && React.createElement("span", { className: "text-sm text-green-600 dark:text-green-400 flex items-center gap-1" }, React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-4 w-4", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" }, React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M5 13l4 4L19 7" })), "Votado")
                )
            ),
            exchange.status === ExchangeStatus.Completed && (
                React.createElement("span", { className: "text-sm text-blue-500 mt-2" }, "Intercambio Completado")
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

  const handleVote = async (exchangeId) => {
    setUpdatingExchangeId(exchangeId);
    try {
        await api.voteForExchange(exchangeId);
        await fetchExchanges();
    } catch (err) {
        setError(err.message || `Error al votar.`);
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
    React.createElement("h1", { className: "text-3xl font-bold mb-6 text-gray-900 dark:text-white" }, "Buzón de Intercambios"),
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
                onVote: handleVote,
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
                onVote: handleVote,
                isUpdating: updatingExchangeId === ex.id
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