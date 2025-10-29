import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { useAuth } from '../hooks/useAuth.tsx';
import Spinner from '../components/Spinner.js';
import Button from '../components/Button.js';
import { useColorTheme } from '../hooks/useColorTheme.js';
import { ExchangeStatus } from '../types.js';
import { useConfetti } from '../hooks/useConfetti.tsx';

const ChatDetailPage = () => {
    const { exchangeId } = useParams();
    const { user } = useAuth();
    const { theme } = useColorTheme();
    const navigate = useNavigate();

    const [exchange, setExchange] = useState(null);
    const [chat, setChat] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [updatingItemId, setUpdatingItemId] = useState(null);
    const { showConfetti } = useConfetti();
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchChatDetails = useCallback(async () => {
        if (!exchangeId) return;
        try {
            const { chat: chatData, exchange: exchangeData } = await api.getChatAndExchangeDetails(exchangeId);
            setChat(chatData);
            setExchange(exchangeData);
            if (exchangeData.status === ExchangeStatus.Accepted) {
                showConfetti();
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [exchangeId, showConfetti]);

    useEffect(() => {
        fetchChatDetails();
    }, [fetchChatDetails]);

    useEffect(() => {
        scrollToBottom();
    }, [chat?.messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !exchangeId) return;

        setIsSending(true);
        try {
            await api.sendMessage(exchangeId, newMessage);
            setNewMessage('');
            await fetchChatDetails(); 
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSending(false);
        }
    };
    
    const handleUpdateItemStatus = async (itemId, status) => {
        if (!exchangeId) return;
        setUpdatingItemId(itemId);
        try {
            await api.updateItemInExchange(exchangeId, itemId, status);
            await fetchChatDetails();
        } catch (err) {
            setError(err.message);
        } finally {
            setUpdatingItemId(null);
        }
    };

    if (loading) {
        return React.createElement(Spinner, null);
    }
    
    if (error) {
        return React.createElement("p", { className: "text-red-500" }, "Error: ", error);
    }
    
    if (!chat || !exchange) {
        return React.createElement("p", null, "Chat no encontrado.");
    }
    
    const otherUser = user.id === exchange.ownerId ? 
        { id: exchange.requesterId, name: exchange.requesterName } : 
        { id: exchange.ownerId, name: exchange.ownerName };

    const isOwner = user.id === exchange.ownerId;

    const renderNegotiationItems = () => {
        const requestedItem = exchange.allItems.find(item => item.id === exchange.requestedItemId);
        const offeredItems = exchange.allItems.filter(item => item.id !== exchange.requestedItemId);
        
        return React.createElement("div", { className: "border rounded-lg p-3 my-4 bg-gray-50 dark:bg-gray-700/50" },
            React.createElement("h3", { className: "font-bold text-center mb-3 text-lg" }, "Artículos en Negociación"),
            React.createElement("div", { className: "space-y-4" },
                React.createElement(NegotiationItemCard, { item: requestedItem, isRequested: true, exchange: exchange, user: user, onUpdate: handleUpdateItemStatus, isUpdating: updatingItemId === requestedItem.id }),
                React.createElement("div", { className: "flex items-center text-center" },
                    React.createElement("div", { className: "flex-grow border-t border-gray-300 dark:border-gray-600" }),
                    React.createElement("span", { className: `flex-shrink mx-2 text-gray-500 dark:text-gray-400 transform transition-transform duration-500 hover:rotate-180`}, React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-8 w-8", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" }, React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" }))),
                    React.createElement("div", { className: "flex-grow border-t border-gray-300 dark:border-gray-600" })
                ),
                React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3" },
                    offeredItems.map(item => React.createElement(NegotiationItemCard, { key: item.id, item: item, isRequested: false, exchange: exchange, user: user, onUpdate: handleUpdateItemStatus, isUpdating: updatingItemId === item.id }))
                )
            )
        );
    };
    
    const NegotiationItemCard = ({ item, isRequested, exchange, user, onUpdate, isUpdating }) => {
        const status = exchange.itemStatus[item.id];
        const canTakeAction = isOwner && status === 'PENDING' && !isRequested;

        const statusStyles = {
            PENDING: 'border-gray-300 dark:border-gray-600',
            ACCEPTED: 'border-green-500 bg-green-50 dark:bg-green-900/50',
            REJECTED: 'border-red-500 bg-red-50 dark:bg-red-900/50 opacity-70',
        };

        const StatusBadge = ({status}) => {
            const badgeStyles = {
                ACCEPTED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
                REJECTED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
            };
            if (status === 'PENDING') return null;
            return React.createElement("div", {className: `absolute top-1 right-1 text-xs font-bold px-2 py-0.5 rounded-full ${badgeStyles[status]}`}, status);
        };

        return React.createElement("div", { className: `border-2 rounded-lg p-2 transition-all relative ${statusStyles[status]}` },
            React.createElement(StatusBadge, { status: status }),
            React.createElement("div", { className: "flex gap-3 items-center" },
                React.createElement("img", { src: item.imageUrls[0], alt: item.title, className: "w-16 h-16 object-cover rounded-md" }),
                React.createElement("div", { className: "flex-grow" },
                    React.createElement("p", { className: "text-xs text-gray-500 dark:text-gray-400" }, isRequested ? `${otherUser.name} quiere:` : `${otherUser.name} ofrece:`),
                    React.createElement(Link, { to: `/item/${item.id}`, className: "font-semibold hover:underline" }, item.title)
                )
            ),
            canTakeAction && React.createElement("div", { className: "flex justify-end gap-2 mt-2" },
                React.createElement(Button, { size: "sm", variant: "danger", onClick: () => onUpdate(item.id, 'REJECTED'), isLoading: isUpdating, children: "Rechazar" }),
                React.createElement(Button, { size: "sm", variant: "primary", onClick: () => onUpdate(item.id, 'ACCEPTED'), isLoading: isUpdating, children: "Aceptar" })
            )
        );
    };

    const renderMessage = (message) => {
        const isCurrentUser = message.senderId === user.id;

        if (message.type === 'SYSTEM') {
            return React.createElement("div", { key: message.id, className: "text-center my-2" },
                React.createElement("span", { className: "text-xs font-semibold text-gray-500 dark:text-gray-400 px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full" },
                    message.text
                )
            );
        }
        
        // The initial proposal message is now just text, items are rendered separately.
        const isInitialProposal = chat.messages.findIndex(m => m.type === 'PROPOSAL') === chat.messages.indexOf(message);
        if (isInitialProposal && !message.text) return null; // Hide empty initial message

        return React.createElement("div", { key: message.id, className: `flex ${isCurrentUser ? 'justify-end' : 'justify-start'}` },
            React.createElement("div", { className: `max-w-xs lg:max-w-md p-3 rounded-lg ${isCurrentUser ? `bg-gradient-to-r ${theme.bg} text-white` : 'bg-gray-200 dark:bg-gray-700'}` },
                React.createElement("p", { className: "text-sm" }, message.text),
                React.createElement("p", { className: `text-xs mt-1 text-right ${isCurrentUser ? 'text-gray-200' : 'text-gray-500'}` }, 
                    new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                )
            )
        );
    };

    return (
        React.createElement("div", { className: "max-w-2xl mx-auto h-[calc(100vh-12rem)] flex flex-col" },
            React.createElement(Link, { to: "/exchanges", className: `flex items-center gap-2 ${theme.textColor} ${theme.hoverTextColor} hover:underline mb-4` },
                "← Volver al buzón"
            ),
            React.createElement("div", { className: "bg-white dark:bg-gray-800 rounded-lg shadow-md flex-grow flex flex-col" },
                React.createElement("div", { className: "p-4 border-b dark:border-gray-700" },
                    React.createElement("h1", { className: "font-bold text-lg" }, 
                        "Conversación con ", 
                        React.createElement(Link, { to: `/user/${otherUser.id}?fromExchange=${exchange.id}`, className: `${theme.textColor} ${theme.hoverTextColor} hover:underline` }, otherUser.name)
                    )
                ),
                React.createElement("div", { className: "flex-grow p-4 overflow-y-auto space-y-4" },
                    renderNegotiationItems(),
                    chat.messages.map(renderMessage),
                    React.createElement("div", { ref: messagesEndRef })
                ),
                
                React.createElement("div", { className: "p-4 border-t dark:border-gray-700" },
                    exchange.status === ExchangeStatus.Pending ?
                    React.createElement("form", { onSubmit: handleSendMessage, className: "flex gap-2" },
                        React.createElement("input", {
                            type: "text",
                            value: newMessage,
                            onChange: e => setNewMessage(e.target.value),
                            placeholder: "Escribe un mensaje...",
                            className: "flex-grow appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100",
                            autoComplete: "off"
                        }),
                        React.createElement(Button, { type: "submit", isLoading: isSending, children: "Enviar" })
                    ) :
                    React.createElement("p", { className: "text-center text-sm text-gray-500 dark:text-gray-400 font-semibold" },
                        `Negociación completada. El chat está cerrado.`
                    )
                )
            )
        )
    );
};

export default ChatDetailPage;