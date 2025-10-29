import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api.js';
import { useAuth } from '../hooks/useAuth.tsx';
import Spinner from '../components/Spinner.js';
import Input from '../components/Input.js';
import Button from '../components/Button.js';
import { useColorTheme } from '../hooks/useColorTheme.js';

const ChatDetailPage = () => {
    const { exchangeId } = useParams();
    const { user } = useAuth();
    const { theme } = useColorTheme();
    const [chat, setChat] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchChat = useCallback(async () => {
        if (!exchangeId) return;
        try {
            const chatData = await api.getChat(exchangeId);
            setChat(chatData);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [exchangeId]);

    useEffect(() => {
        fetchChat();
    }, [fetchChat]);

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
            await fetchChat(); // Refetch to get the new message
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSending(false);
        }
    };

    if (loading) {
        return React.createElement(Spinner, null);
    }
    
    if (error) {
        return React.createElement("p", { className: "text-red-500" }, "Error: ", error);
    }
    
    if (!chat) {
        return React.createElement("p", null, "Chat no encontrado.");
    }

    return (
        React.createElement("div", { className: "max-w-2xl mx-auto h-[calc(100vh-12rem)] flex flex-col" },
            React.createElement(Link, { to: "/exchanges", className: `flex items-center gap-2 ${theme.textColor} ${theme.hoverTextColor} hover:underline mb-4` },
                "← Volver al buzón"
            ),
            React.createElement("div", { className: "bg-white dark:bg-gray-800 rounded-lg shadow-md flex-grow flex flex-col" },
                React.createElement("div", { className: "p-4 border-b dark:border-gray-700" },
                    React.createElement("h1", { className: "font-bold text-lg" }, "Conversación de Intercambio")
                ),
                React.createElement("div", { className: "flex-grow p-4 overflow-y-auto space-y-4" },
                    chat.messages.map(message => {
                        const isCurrentUser = message.senderId === user.id;
                        return React.createElement("div", { key: message.id, className: `flex ${isCurrentUser ? 'justify-end' : 'justify-start'}` },
                            React.createElement("div", { className: `max-w-xs lg:max-w-md p-3 rounded-lg ${isCurrentUser ? `bg-gradient-to-r ${theme.bg} text-white` : 'bg-gray-200 dark:bg-gray-700'}` },
                                React.createElement("p", { className: "text-sm" }, message.text),
                                React.createElement("p", { className: `text-xs mt-1 text-right ${isCurrentUser ? 'text-gray-200' : 'text-gray-500'}` }, 
                                    new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                )
                            )
                        );
                    }),
                    React.createElement("div", { ref: messagesEndRef })
                ),
                React.createElement("div", { className: "p-4 border-t dark:border-gray-700" },
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
                    )
                )
            )
        )
    );
};

export default ChatDetailPage;
