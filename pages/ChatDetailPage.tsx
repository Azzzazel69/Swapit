import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api.ts';
import { useAuth } from '../hooks/useAuth.tsx';
import SwapSpinner from '../components/SwapSpinner.tsx';
import Button from '../components/Button.tsx';
import { useColorTheme } from '../hooks/useColorTheme.tsx';
import { ExchangeStatus } from '../types.ts';
import { useConfetti } from '../hooks/useConfetti.tsx';
import { ICONS } from '../constants.tsx';
import ExchangeProposalModal from '../components/ExchangeProposalModal.tsx';

const DealCompletedInfo = ({ exchange, currentUser }) => {
    const otherUser = currentUser.id === exchange.owner.id ? exchange.requester : exchange.owner;
    
    return (
        React.createElement("div", { className: "text-center p-4 my-4 bg-green-50 dark:bg-green-900/50 border-2 border-dashed border-green-400 rounded-lg" },
            React.createElement("h2", { className: "text-2xl font-bold text-green-700 dark:text-green-300 mb-2" }, "¡Intercambio Completado!"),
            React.createElement("p", { className: "text-gray-600 dark:text-gray-400" }, "Ponte en contacto con ", React.createElement("strong", null, otherUser.name), " para coordinar la entrega."),
            React.createElement("div", { className: "mt-4 text-left inline-block" },
                React.createElement("p", null, React.createElement("strong", null, "Correo: "), React.createElement("a", { href: `mailto:${otherUser.email}`, className: "text-blue-600 hover:underline" }, otherUser.email)),
                React.createElement("p", null, React.createElement("strong", null, "Teléfono: "), React.createElement("a", { href: `tel:${otherUser.phone}`, className: "text-blue-600 hover:underline" }, otherUser.phone))
            )
        )
    );
};

const Message = ({ message, senderName, isOwnMessage }) => {
    const bubbleClasses = isOwnMessage
        ? "bg-blue-500 text-white self-end"
        : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 self-start";

    if (message.type === 'SYSTEM') {
        return React.createElement("div", { className: "text-center text-xs text-gray-500 dark:text-gray-400 py-2" },
            React.createElement("span", { className: "bg-gray-100 dark:bg-gray-700 rounded-full px-3 py-1" }, message.text)
        );
    }
    
    return React.createElement("div", { className: `flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}` },
        React.createElement("div", { className: `max-w-md rounded-lg px-4 py-2 ${bubbleClasses}` },
            !isOwnMessage && React.createElement("p", { className: "text-xs font-bold mb-1" }, senderName),
            React.createElement("p", { className: "text-sm" }, message.text)
        ),
        React.createElement("p", { className: "text-xs text-gray-400 mt-1" }, new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
    );
};

const ItemBar = ({ exchange }) => {
    const { theme } = useColorTheme();
    const ItemPreview = ({ item, isRequested }) => (
        React.createElement(Link, { to: `/item/${item.id}`, className: "flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex-shrink-0 w-52" },
            React.createElement("img", { src: item.imageUrls[0], alt: item.title, className: "w-10 h-10 rounded-md object-cover" }),
            React.createElement("div", { className: "flex-grow overflow-hidden" },
                React.createElement("p", { className: "text-xs text-gray-500 dark:text-gray-400" }, isRequested ? `${exchange.owner.name} ofrece:` : `${exchange.requester.name} ofrece:`),
                React.createElement("p", { className: "text-sm font-semibold truncate" }, item.title)
            )
        )
    );
    
    const requestedItem = exchange.allItems.find(i => i.id === exchange.requestedItemId);
    const offeredItems = exchange.allItems.filter(i => exchange.offeredItemIds.includes(i.id));

    return React.createElement("div", { className: "bg-white dark:bg-gray-800 border-b dark:border-gray-700" },
      React.createElement("div", { className: "flex items-center justify-start md:justify-center gap-4 flex-nowrap overflow-x-auto p-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" },
        React.createElement("div", { className: "flex flex-col sm:flex-row gap-2" },
            offeredItems.map(item => React.createElement(ItemPreview, { key: item.id, item: item, isRequested: false }))
        ),
        React.createElement("div", { className: `text-2xl font-bold ${theme.textColor} flex-shrink-0 mx-2` }, ICONS.swap),
        React.createElement(ItemPreview, { item: requestedItem, isRequested: true })
      )
    );
};

// Memoize ItemBar to prevent re-rendering on every message poll
const areItemBarsEqual = (prevProps, nextProps) => {
    // Only re-render if the item IDs or status change. This prevents flickering from polling.
    return prevProps.exchange.status === nextProps.exchange.status &&
           JSON.stringify(prevProps.exchange.offeredItemIds) === JSON.stringify(nextProps.exchange.offeredItemIds) &&
           prevProps.exchange.requestedItemId === nextProps.exchange.requestedItemId;
};
const MemoizedItemBar = React.memo(ItemBar, areItemBarsEqual);


const MessageInput = ({ onSendMessage, isLoading }) => {
    const [text, setText] = useState('');
    const handleSubmit = (e) => {
        e.preventDefault();
        if(text.trim()){
            onSendMessage(text);
            setText('');
        }
    };

    return React.createElement("form", { onSubmit: handleSubmit, className: "p-4 bg-white dark:bg-gray-800 border-t dark:border-gray-700 flex items-center gap-2" },
        React.createElement("input", {
            type: "text",
            value: text,
            onChange: e => setText(e.target.value),
            placeholder: "Escribe tu mensaje...",
            className: "flex-grow appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white",
            disabled: isLoading
        }),
        React.createElement(Button, {
            type: "submit",
            isLoading: isLoading,
            disabled: !text.trim(),
            className: "rounded-full !p-3",
            children: React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-5 w-5", viewBox: "0 0 20 20", fill: "currentColor" }, React.createElement("path", { d: "M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" }))
        })
    );
};

const ActionBar = ({ exchange, currentUser, onAccept, onReject, onConfirm, onModify, onCounterOffer, isLoading }) => {
    const isOwner = currentUser.id === exchange.owner.id;
    const isRequester = currentUser.id === exchange.requester.id;
    
    if (exchange.status === ExchangeStatus.Rejected) {
        return (
            React.createElement("div", { className: "p-3 bg-red-50 dark:bg-red-900/50 border-t border-red-200 dark:border-red-800 text-center" },
                React.createElement("p", { className: "font-semibold text-red-800 dark:text-red-200" }, "Propuesta Rechazada")
            )
        );
    }

    if (exchange.status === ExchangeStatus.Pending) {
        if (isOwner) {
            return (
                React.createElement("div", { className: "p-3 bg-gray-100 dark:bg-gray-900 border-t dark:border-gray-700 flex items-center justify-center gap-4 flex-wrap" },
                    React.createElement(Button, { onClick: onAccept, isLoading: isLoading, size: "sm", children: "Aceptar Propuesta" }),
                    React.createElement(Button, { onClick: onReject, isLoading: isLoading, variant: "danger", size: "sm", children: "Rechazar" }),
                    React.createElement(Button, { onClick: onCounterOffer, isLoading: isLoading, variant: "secondary", size: "sm", children: "Pedir otro artículo" })
                )
            );
        }
        if (isRequester) {
            return (
                React.createElement("div", { className: "p-3 bg-gray-100 dark:bg-gray-900 border-t dark:border-gray-700 text-center" },
                     React.createElement("p", { className: "text-sm text-gray-600 dark:text-gray-400 mb-2" }, "Has enviado una propuesta. Esperando respuesta de ", exchange.owner.name, "."),
                     React.createElement(Button, { onClick: onModify, isLoading: isLoading, variant: "secondary", size: "sm", children: "Modificar Propuesta" })
                )
            );
        }
    }

    if (exchange.status === ExchangeStatus.Accepted) {
        const alreadyConfirmed = (isOwner && exchange.confirmedByOwner) || (isRequester && exchange.confirmedByRequester);
        return (
            React.createElement("div", { className: "p-3 bg-blue-50 dark:bg-blue-900/50 border-t border-blue-200 dark:border-blue-800 text-center" },
                React.createElement("p", { className: "font-semibold text-blue-800 dark:text-blue-200 mb-2" }, "¡Propuesta Aceptada!"),
                React.createElement("p", { className: "text-sm text-gray-600 dark:text-gray-400 mb-3" }, "Ambos debéis confirmar la realización del intercambio para finalizar y poder valoraros."),
                alreadyConfirmed ? (
                    React.createElement("div", { className: "flex items-center justify-center gap-2 text-sm font-bold text-green-600" },
                        ICONS.checkCircle,
                        React.createElement("span", null, "¡Has confirmado! Esperando al otro usuario.")
                    )
                ) : (
                    React.createElement(Button, { onClick: onConfirm, isLoading: isLoading, size: "sm", children: "Confirmar Intercambio Realizado y Votar" })
                )
            )
        );
    }
    
    return null;
};

const ChatDetailPage = () => {
    const { exchangeId } = useParams();
    const { user: currentUser } = useAuth();
    const { showConfetti } = useConfetti();
    const navigate = useNavigate();
    const [chat, setChat] = useState(null);
    const [exchange, setExchange] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isSending, setIsSending] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [isModifyModalOpen, setIsModifyModalOpen] = useState(false);
    const [userItems, setUserItems] = useState([]);

    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };
    
    useEffect(() => {
        if (!exchange || !currentUser) return;

        // Confetti logic: Show it once per user when an exchange is accepted or completed.
        const confettiKey = `confetti_seen_for_exchange_${exchange.id}_by_user_${currentUser.id}`;
        const hasSeenConfetti = typeof window !== 'undefined' ? window.localStorage.getItem(confettiKey) === 'true' : false;

        if ((exchange.status === ExchangeStatus.Accepted || exchange.status === ExchangeStatus.Completed) && !hasSeenConfetti) {
            showConfetti();
            if (typeof window !== 'undefined') {
                window.localStorage.setItem(confettiKey, 'true');
            }
        }
    }, [exchange, showConfetti, currentUser]);

    const fetchData = useCallback(async (isInitialLoad = false) => {
        if (!exchangeId || !currentUser) return;
        try {
            if (isInitialLoad) setLoading(true);
            const { chat: fetchedChat, exchange: fetchedExchange } = await api.getChatAndExchangeDetails(exchangeId);
            setChat(fetchedChat);
            setExchange(fetchedExchange);
            if (isInitialLoad) setError(null);
        } catch (err) {
            if (isInitialLoad) setError('Error al cargar el chat.');
        } finally {
            if (isInitialLoad) setLoading(false);
        }
    }, [exchangeId, currentUser]);
    
    useEffect(() => {
        let isMounted = true;
        fetchData(true).then(() => {
            if (isMounted) {
                setTimeout(() => scrollToBottom(), 100);
            }
        });

        const intervalId = setInterval(() => {
            if (isMounted && document.visibilityState === 'visible') {
                fetchData(false);
            }
        }, 3000); 

        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, [fetchData]);

    useEffect(scrollToBottom, [chat?.messages]);
    
    const handleAction = async (actionFn) => {
        setActionLoading(true);
        setError(null);
        try {
            await actionFn();
            await fetchData(true); // Refetch all data after action
        } catch (err) {
            setError(err.message || 'Error al realizar la acción.');
        } finally {
            setActionLoading(false);
        }
    };
    
    const handleSendMessage = (text) => handleAction(() => api.sendMessage(exchangeId, text));
    const handleAccept = () => handleAction(() => api.respondToExchange(exchangeId, 'ACCEPT'));
    const handleReject = () => handleAction(() => api.respondToExchange(exchangeId, 'REJECT'));
    
    const handleNavigateToRating = () => {
        navigate(`/rate-exchange/${exchangeId}`);
    };
    
    const handleModify = async () => {
        const currentUserItems = await api.getUserItems(currentUser.id);
        setUserItems(currentUserItems.filter(i => i.status === 'AVAILABLE' || exchange.offeredItemIds.includes(i.id)));
        setIsModifyModalOpen(true);
    };

    const handleSubmitModification = (data) => {
        setIsModifyModalOpen(false);
        handleAction(() => api.modifyExchangeProposal(exchangeId, data));
    };

    const handleCounterOffer = () => {
        navigate(`/user/${exchange.requester.id}?fromExchange=${exchange.id}`);
    };
    
    if (loading) return React.createElement("div", { className: "flex justify-center items-center h-64" }, React.createElement(SwapSpinner, null));
    if (error) return React.createElement("div", { className: "text-center text-red-500" }, error);
    if (!chat || !exchange || !currentUser) return React.createElement("div", { className: "text-center" }, "No se encontraron datos del chat.");

    const otherUser = currentUser.id === exchange.owner.id ? exchange.requester : exchange.owner;

    return (
        React.createElement("div", { className: "flex flex-col h-[calc(100vh_-_4rem_-_2.5rem_-_env(safe-area-inset-bottom,0))] md:h-[calc(100vh_-_4.5rem_-_3rem_-_env(safe-area-inset-bottom,0))] bg-gray-50 dark:bg-gray-900 max-w-4xl mx-auto rounded-lg shadow-lg border dark:border-gray-700" },
            React.createElement("div", { className: "p-3 border-b dark:border-gray-700 bg-white dark:bg-gray-800 rounded-t-lg flex items-center justify-center gap-3" },
                React.createElement("img", { src: otherUser.avatarUrl, alt: otherUser.name, className: "w-8 h-8 rounded-full object-cover" }),
                React.createElement("h1", { className: "text-lg font-bold text-center" }, "Intercambio con ", otherUser.name)
            ),
            React.createElement(MemoizedItemBar, { exchange: exchange }),
            React.createElement("div", { className: "flex-grow overflow-y-auto p-4 space-y-4" },
                chat.messages.map(msg => (
                    React.createElement(Message, { key: msg.id, message: msg, senderName: msg.senderId === currentUser.id ? 'Tú' : otherUser.name, isOwnMessage: msg.senderId === currentUser.id })
                )),
                React.createElement("div", { ref: messagesEndRef })
            ),

            error && React.createElement("p", { className: "text-red-500 text-sm text-center p-2" }, error),
            
            exchange.status === ExchangeStatus.Completed && (
                React.createElement(DealCompletedInfo, { exchange: exchange, currentUser: currentUser })
            ),

            React.createElement(ActionBar, { 
                exchange: exchange, 
                currentUser: currentUser,
                onAccept: handleAccept,
                onReject: handleReject,
                onConfirm: handleNavigateToRating,
                onModify: handleModify,
                onCounterOffer: handleCounterOffer,
                isLoading: actionLoading
            }),
            
            exchange.status !== ExchangeStatus.Completed && exchange.status !== ExchangeStatus.Rejected && (
                React.createElement(MessageInput, { onSendMessage: handleSendMessage, isLoading: isSending || actionLoading })
            ),
            
            isModifyModalOpen && (
                React.createElement(ExchangeProposalModal, {
                    isOpen: isModifyModalOpen,
                    onClose: () => setIsModifyModalOpen(false),
                    userItems: userItems,
                    targetItem: exchange.allItems.find(i => i.id === exchange.requestedItemId),
                    onSubmit: handleSubmitModification,
                    isLoading: actionLoading,
                    isModification: true,
                    existingExchange: exchange
                })
            )
        )
    );
};

export default ChatDetailPage;