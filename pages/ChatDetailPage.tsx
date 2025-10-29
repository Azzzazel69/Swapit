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
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
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
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [exchangeId]);

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

    const handleUpdateStatus = async (status) => {
        if (!exchangeId) return;
        setIsUpdatingStatus(true);
        try {
            await api.updateExchangeStatus(exchangeId, status);
            if (status === ExchangeStatus.Accepted) {
                showConfetti();
            } else if (status === ExchangeStatus.Rejected) {
                // Navegar después de un breve retraso para que el usuario vea el mensaje
                setTimeout(() => navigate('/exchanges'), 2000);
            }
            await fetchChatDetails();
        } catch (err) {
            setError(err.message);
        } finally {
            setIsUpdatingStatus(false);
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
    const canTakeAction = isOwner && exchange.status === ExchangeStatus.Pending;

    const renderMessage = (message) => {
        const isCurrentUser = message.senderId === user.id;

        if (message.type === 'SYSTEM') {
            return React.createElement("div", { key: message.id, className: "text-center my-2" },
                React.createElement("span", { className: "text-xs font-semibold text-gray-500 dark:text-gray-400 px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full" },
                    message.text
                )
            );
        }

        if (message.type === 'PROPOSAL') {
            return React.createElement("div", { key: message.id, className: "my-2" },
                React.createElement("div", { className: "text-center" },
                  React.createElement("span", { className: "text-xs text-gray-500 dark:text-gray-400 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full" },
                      `${exchange.requesterName} ha propuesto un intercambio`
                  )
                ),
                React.createElement("p", {className: "text-sm text-gray-600 dark:text-gray-400 my-2"}, "Artículos ofrecidos:"),
                React.createElement("div", { className: "grid grid-cols-2 sm:grid-cols-3 gap-2 my-2" },
                    message.offeredItems.map(item => (
                        React.createElement(Link, { to: `/item/${item.id}`, key: item.id, className: "block border rounded-lg p-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors", target: "_blank" },
                            React.createElement("img", { src: item.imageUrl, alt: item.title, className: "w-full h-16 object-cover rounded"}),
                            React.createElement("p", { className: "text-xs mt-1 truncate font-semibold" }, item.title)
                        )
                    ))
                ),
                message.text && React.createElement("div", { className: `flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mt-2` },
                    React.createElement("div", { className: `max-w-xs lg:max-w-md p-3 rounded-lg bg-gray-200 dark:bg-gray-700` },
                        React.createElement("p", { className: "text-sm" }, message.text),
                        React.createElement("p", { className: `text-xs mt-1 text-right text-gray-500` }, 
                            new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        )
                    )
                )
            );
        }

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
                    React.createElement("h1", { className: "font-bold text-lg" }, "Conversación con ", React.createElement("span", {className: theme.textColor }, otherUser.name))
                ),
                React.createElement("div", { className: "flex-grow p-4 overflow-y-auto space-y-4" },
                    chat.messages.map(renderMessage),
                    React.createElement("div", { ref: messagesEndRef })
                ),

                canTakeAction && React.createElement("div", { className: "p-4 bg-gray-50 dark:bg-gray-900 border-t dark:border-gray-700 flex justify-center gap-4" },
                    React.createElement(Button, { variant: "danger", onClick: () => handleUpdateStatus(ExchangeStatus.Rejected), isLoading: isUpdatingStatus, children: "Rechazar Trato" }),
                    React.createElement(Button, { variant: "primary", onClick: () => handleUpdateStatus(ExchangeStatus.Accepted), isLoading: isUpdatingStatus, children: "Aceptar Trato" })
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
                        `Este intercambio fue ${exchange.status === ExchangeStatus.Accepted ? 'aceptado' : 'rechazado'}. El chat está cerrado.`
                    )
                )
            )
        )
    );
};

export default ChatDetailPage;