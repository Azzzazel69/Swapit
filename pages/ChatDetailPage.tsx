
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
import ReportModal from '../components/ReportModal.tsx';
import { useToast } from '../hooks/useToast.tsx';

const ContactCardContent = ({ contactCard, avatarUrl }) => {
    const canShare = contactCard?.name && contactCard?.phone;
    const handleShare = () => { if (navigator.share && canShare) { navigator.share({ title: `Contacto de ${contactCard.name}`, text: `Tel: ${contactCard.phone}` }).catch(console.log); } };
    const handleAddToContacts = () => { /*...*/ }; 
    return (
        React.createElement("div", { className: "mt-4 text-left p-4 bg-white dark:bg-gray-800 rounded-lg shadow-inner max-w-sm mx-auto" },
            React.createElement("div", { className: "flex items-center gap-4 mb-4" },
                React.createElement("img", { src: avatarUrl, alt: contactCard.name, className: "w-16 h-16 rounded-full object-cover" }),
                React.createElement("div", null, React.createElement("p", { className: "text-lg font-bold" }, contactCard.name))
            ),
            React.createElement("div", { className: "space-y-3" },
                contactCard.email && React.createElement("p", null, contactCard.email),
                contactCard.phone && React.createElement("p", null, contactCard.phone)
            )
        )
    );
};

const Message = ({ message, senderName, isOwnMessage, isAdminView, onCensor }) => {
    const bubbleClasses = isOwnMessage
        ? "bg-blue-500 text-white self-end"
        : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 self-start";

    if (message.type === 'SYSTEM') {
        return React.createElement("div", { className: "text-center text-xs text-gray-500 dark:text-gray-400 py-2" },
            React.createElement("span", { className: "bg-gray-100 dark:bg-gray-700 rounded-full px-3 py-1" }, message.text)
        );
    }
    
    return React.createElement("div", { className: `group flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} relative` },
        React.createElement("div", { className: `max-w-md rounded-lg px-4 py-2 ${bubbleClasses}` },
            !isOwnMessage && React.createElement("p", { className: "text-xs font-bold mb-1" }, senderName),
            React.createElement("p", { className: "text-sm" }, message.text)
        ),
        React.createElement("p", { className: "text-xs text-gray-400 mt-1" }, new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })),
        
        // Admin Censor Button
        isAdminView && message.text !== "[CONTENIDO ELIMINADO POR MODERACIÓN]" && (
            React.createElement("button", { 
                onClick: () => onCensor(message.id),
                className: "absolute -right-8 top-2 opacity-0 group-hover:opacity-100 text-xs bg-red-100 text-red-600 px-1 rounded hover:bg-red-200 transition-opacity",
                title: "Censurar mensaje"
            }, "🚫")
        )
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
      React.createElement("div", { className: "flex items-center justify-start md:justify-center gap-4 flex-nowrap overflow-x-auto p-2" },
        React.createElement("div", { className: "flex flex-col sm:flex-row gap-2" },
            offeredItems.map(item => React.createElement(ItemPreview, { key: item.id, item: item, isRequested: false }))
        ),
        React.createElement("div", { className: `text-2xl font-bold ${theme.textColor} flex-shrink-0 mx-2` }, ICONS.swap),
        React.createElement(ItemPreview, { item: requestedItem, isRequested: true })
      )
    );
};
const MemoizedItemBar = React.memo(ItemBar);

const MessageInput = ({ onSendMessage, isLoading }) => {
    const [text, setText] = useState('');
    const handleSubmit = (e) => { e.preventDefault(); if(text.trim()){ onSendMessage(text); setText(''); } };
    return React.createElement("form", { onSubmit: handleSubmit, className: "p-4 bg-white dark:bg-gray-800 border-t dark:border-gray-700 flex items-center gap-2" },
        React.createElement("input", { type: "text", value: text, onChange: e => setText(e.target.value), placeholder: "Escribe tu mensaje...", className: "flex-grow appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white", disabled: isLoading }),
        React.createElement(Button, { type: "submit", isLoading: isLoading, disabled: !text.trim(), className: "rounded-full !p-3", children: "Enviar" })
    );
};

const ActionBar = ({ exchange, currentUser, onAccept, onReject, onConfirm, onModify, onCounterOffer, isLoading }) => {
    const isOwner = currentUser.id === exchange.owner.id;
    const isRequester = currentUser.id === exchange.requester.id;
    
    if (exchange.status === ExchangeStatus.Rejected) return React.createElement("div", { className: "p-3 bg-red-50 text-center" }, "Propuesta Rechazada");
    if (exchange.status === ExchangeStatus.Cancelled) return React.createElement("div", { className: "p-3 bg-gray-100 text-center" }, "Cancelado");
    if (exchange.status === ExchangeStatus.Pending) {
        if (isOwner) return React.createElement("div", { className: "p-3 flex justify-center gap-4" }, React.createElement(Button, { onClick: onAccept, size: "sm", children: "Aceptar" }), React.createElement(Button, { onClick: onReject, variant: "danger", size: "sm", children: "Rechazar" }), React.createElement(Button, { onClick: onCounterOffer, variant: "secondary", size: "sm", children: "Contraoferta" }));
        if (isRequester) return React.createElement("div", { className: "p-3 text-center" }, React.createElement("p", {className:"mb-2"}, "Esperando respuesta"), React.createElement(Button, { onClick: onModify, variant: "secondary", size: "sm", children: "Modificar" }));
    }
    if (exchange.status === ExchangeStatus.Accepted) {
        const alreadyConfirmed = (isOwner && exchange.confirmedByOwner) || (isRequester && exchange.confirmedByRequester);
        return React.createElement("div", { className: "p-3 text-center bg-blue-50" }, alreadyConfirmed ? "Esperando al otro usuario" : React.createElement(Button, { onClick: onConfirm, size: "sm", children: "Confirmar Intercambio" }));
    }
    return null;
};

const ChatDetailPage = () => {
    const { exchangeId } = useParams();
    const { user: currentUser } = useAuth();
    const { showConfetti } = useConfetti();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [chat, setChat] = useState(null);
    const [exchange, setExchange] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isSending, setIsSending] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [isModifyModalOpen, setIsModifyModalOpen] = useState(false);
    const [userItems, setUserItems] = useState([]);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

    const messagesEndRef = useRef(null);
    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    
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
        fetchData(true).then(() => { if (isMounted) setTimeout(scrollToBottom, 100); });
        const intervalId = setInterval(() => { if (isMounted) fetchData(false); }, 3000); 
        return () => { isMounted = false; clearInterval(intervalId); };
    }, [fetchData]);

    useEffect(scrollToBottom, [chat?.messages]);

    const handleAction = async (actionFn) => {
        setActionLoading(true);
        try { await actionFn(); await fetchData(true); } catch (err) { setError(err.message); } finally { setActionLoading(false); }
    };
    
    const handleSendMessage = (text) => handleAction(() => api.sendMessage(exchangeId, text));
    const handleAccept = () => handleAction(() => api.respondToExchange(exchangeId, 'ACCEPT'));
    const handleReject = () => handleAction(() => api.respondToExchange(exchangeId, 'REJECT'));
    const handleNavigateToRating = () => navigate(`/rate-exchange/${exchangeId}`);
    const handleModify = async () => { /*...*/ setIsModifyModalOpen(true); }; 
    const handleSubmitModification = (data) => { setIsModifyModalOpen(false); handleAction(() => api.modifyExchangeProposal(exchangeId, data)); };
    const handleCounterOffer = () => navigate(`/user/${exchange.requester.id}?fromExchange=${exchange.id}`);

    // --- Admin Actions ---
    const handleBanUser = async (userId, userName) => {
        if(window.confirm(`¿Estás seguro de que quieres banear a ${userName}?`)) {
            try {
                await api.banUser(userId);
                alert(`Usuario ${userName} baneado/desbaneado.`);
                fetchData(true);
            } catch(e) { alert(e.message); }
        }
    };

    const handleCensorMessage = async (messageId) => {
        if(window.confirm("¿Censurar este mensaje?")) {
            try {
                await api.censorMessage(exchangeId, messageId);
                fetchData(true);
            } catch(e) { alert(e.message); }
        }
    };

    const handleReport = async (reason) => {
        try {
            await api.reportContent(exchange.id, 'CHAT', reason);
            showToast('Reporte enviado. Revisaremos la conversación.', 'success');
        } catch (err) {
            showToast(err.message || 'Error al enviar el reporte.', 'error');
        }
    };

    if (loading) return React.createElement("div", { className: "flex justify-center items-center h-64" }, React.createElement(SwapSpinner, null));
    if (error) return React.createElement("div", { className: "text-center text-red-500" }, error);
    if (!chat || !exchange || !currentUser) return React.createElement("div", { className: "text-center" }, "Chat no encontrado.");

    const isViewingAsAdmin = currentUser.role === 'SUPER_ADMIN';

    return (
        React.createElement("div", { className: "flex flex-col h-[calc(100vh_-_4rem_-_2.5rem_-_env(safe-area-inset-bottom,0))] md:h-[calc(100vh_-_4.5rem_-_3rem_-_env(safe-area-inset-bottom,0))] bg-gray-50 dark:bg-gray-900 max-w-4xl mx-auto rounded-lg shadow-lg border dark:border-gray-700" },
            React.createElement(ReportModal, {
                isOpen: isReportModalOpen,
                onClose: () => setIsReportModalOpen(false),
                title: "Reportar Chat",
                onSubmit: handleReport
            }),
            // Header
            React.createElement("div", { className: "p-3 border-b dark:border-gray-700 bg-white dark:bg-gray-800 rounded-t-lg flex flex-col justify-center relative" },
                React.createElement("div", { className: "flex items-center justify-center gap-3 relative" },
                    React.createElement("img", { src: exchange.requester.avatarUrl, className: "w-8 h-8 rounded-full" }),
                    React.createElement("h1", { className: "text-lg font-bold" }, `${exchange.requester.name} ⇄ ${exchange.owner.name}`),
                    React.createElement("img", { src: exchange.owner.avatarUrl, className: "w-8 h-8 rounded-full" }),
                    
                    // User Report Button (Only for participants, not admin)
                    !isViewingAsAdmin && (
                        React.createElement("button", { 
                            onClick: () => setIsReportModalOpen(true),
                            className: "absolute right-0 text-gray-400 hover:text-red-500 transition-colors p-2",
                            title: "Reportar conversación"
                        }, ICONS.flag)
                    )
                ),
                isViewingAsAdmin && (
                    React.createElement("div", { className: "flex justify-center gap-2 mt-2" },
                        React.createElement("span", { className: "text-xs font-bold bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full mr-2" }, "ADMIN MODE"),
                        React.createElement(Button, { size: "sm", variant: "danger", className: "!py-0 !px-2 !text-xs", onClick: () => handleBanUser(exchange.requester.id, exchange.requester.name) }, `Ban ${exchange.requester.name}`),
                        React.createElement(Button, { size: "sm", variant: "danger", className: "!py-0 !px-2 !text-xs", onClick: () => handleBanUser(exchange.owner.id, exchange.owner.name) }, `Ban ${exchange.owner.name}`)
                    )
                )
            ),
            
            React.createElement(MemoizedItemBar, { exchange: exchange }),
            
            // Messages
            React.createElement("div", { className: "flex-grow overflow-y-auto p-4 space-y-4" },
                chat.messages.map(msg => {
                    const sender = msg.senderId === exchange.owner.id ? exchange.owner : exchange.requester;
                    return React.createElement(Message, { 
                        key: msg.id, 
                        message: msg, 
                        senderName: sender.name, 
                        isOwnMessage: msg.senderId === currentUser.id,
                        isAdminView: isViewingAsAdmin,
                        onCensor: handleCensorMessage
                    })
                }),
                React.createElement("div", { ref: messagesEndRef })
            ),

            // Controls
            !isViewingAsAdmin && React.createElement(ActionBar, { 
                exchange: exchange, 
                currentUser: currentUser,
                onAccept: handleAccept,
                onReject: handleReject,
                onConfirm: handleNavigateToRating,
                onModify: handleModify,
                onCounterOffer: handleCounterOffer,
                isLoading: actionLoading
            }),
            
            !isViewingAsAdmin && exchange.status !== ExchangeStatus.Completed && exchange.status !== ExchangeStatus.Rejected && exchange.status !== ExchangeStatus.Cancelled && (
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
