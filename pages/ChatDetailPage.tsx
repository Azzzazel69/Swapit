
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api, DEFAULT_AVATAR_NEUTRAL } from '../services/api.ts';
import { useAuth } from '../hooks/useAuth.tsx';
import SwapSpinner from '../components/SwapSpinner.tsx';
import Button from '../components/Button.tsx';
import { useColorTheme } from '../hooks/useColorTheme.tsx';
import { ExchangeStatus } from '../types.ts';
import { useConfetti } from '../hooks/useConfetti.tsx';
import { ICONS } from '../constants.tsx';
import ExchangeProposalModal from '../components/ExchangeProposalModal.tsx';
import ReportModal from '../components/ReportModal.tsx';
import { useToast } from '../hooks/useToast.tsx';
import BanUserModal from '../components/BanUserModal.tsx';

// Components remain similar but logic for handleSendMessage is updated

const Message = ({ message, senderName, isOwnMessage, isAdminView, onCensor }) => {
    const bubbleClasses = isOwnMessage
        ? "bg-blue-500 text-white self-end"
        : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 self-start";

    if (message.type === 'SYSTEM') {
        return React.createElement("div", { className: "text-center text-xs text-gray-500 dark:text-gray-400 py-2 px-4" },
            React.createElement("span", { className: "bg-gray-100 dark:bg-gray-800 border dark:border-gray-700 rounded-full px-4 py-1.5 shadow-sm" }, 
                message.text
            )
        );
    }
    
    return React.createElement("div", { className: `group flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} relative` },
        React.createElement("div", { className: `max-w-md rounded-lg px-4 py-2 ${bubbleClasses}` },
            !isOwnMessage && React.createElement("p", { className: "text-xs font-bold mb-1" }, senderName),
            React.createElement("p", { className: "text-sm" }, message.text)
        ),
        React.createElement("p", { className: "text-xs text-gray-400 mt-1" }, new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })),
        isAdminView && (
            React.createElement("button", { onClick: () => onCensor(message.id), className: "absolute -right-8 top-2 opacity-0 group-hover:opacity-100" }, "🚫")
        )
    );
};

const ChatDetailPage = () => {
    const { exchangeId } = useParams();
    const { user: currentUser } = useAuth();
    const { showToast } = useToast();
    const [chat, setChat] = useState(null);
    const [exchange, setExchange] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const fetchData = useCallback(async () => {
        try {
            const data = await api.getChatAndExchangeDetails(exchangeId);
            setChat(data.chat);
            setExchange(data.exchange);
        } catch (e) { showToast("Error cargando chat", "error"); }
        finally { setLoading(false); }
    }, [exchangeId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleSendMessage = async (text) => {
        setActionLoading(true);
        try {
            await api.sendMessage(exchangeId, text);
            fetchData();
        } catch (err: any) {
            showToast(err.message, "error");
        } finally {
            setActionLoading(true); // Wait a bit for feedback
            setTimeout(() => setActionLoading(false), 500);
        }
    };

    if (loading) return React.createElement(SwapSpinner, { size: 'lg' });
    if (!chat || !exchange) return React.createElement("div", null, "No se encontró el chat.");

    const partner = exchange.ownerId === currentUser.id ? exchange.requester : exchange.owner;

    return (
        React.createElement("div", { className: "flex flex-col h-screen max-w-4xl mx-auto bg-white dark:bg-gray-900 shadow-xl" },
            React.createElement("div", { className: "p-4 border-b dark:border-gray-700 flex items-center gap-4" },
                React.createElement("img", { src: partner.avatarUrl, className: "w-10 h-10 rounded-full" }),
                React.createElement("h1", { className: "font-bold" }, partner.name)
            ),
            React.createElement("div", { className: "flex-grow overflow-y-auto p-4 space-y-4" },
                chat.messages.map(m => React.createElement(Message, { 
                    key: m.id, 
                    message: m, 
                    isOwnMessage: m.senderId === currentUser.id, 
                    senderName: partner.name,
                    isAdminView: false,
                    onCensor: () => {}
                }))
            ),
            React.createElement("form", { 
                onSubmit: (e) => { e.preventDefault(); const t = (e.target as any).msg.value; if(t) handleSendMessage(t); (e.target as any).msg.value = ''; },
                className: "p-4 border-t dark:border-gray-700 flex gap-2"
            },
                React.createElement("input", { name: "msg", className: "flex-grow p-2 border rounded dark:bg-gray-800", placeholder: "Escribe algo..." }),
                React.createElement(Button, { type: "submit", isLoading: actionLoading, children: "Enviar" })
            )
        )
    );
};

export default ChatDetailPage;
