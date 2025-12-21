
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

const ContactCard = ({ partner, exchangeId, theme }) => {
    const navigate = useNavigate();
    const { contactCard, avatarUrl, location, name } = partner;
    
    if (!contactCard || !contactCard.enabled) return null;

    const hasLocationData = location?.lat && location?.lng;

    return (
        React.createElement("div", { className: "mt-2 mb-4 animate-fade-in-up" },
            React.createElement("div", { className: "bg-white dark:bg-gray-800 border-2 border-dashed border-blue-400 dark:border-blue-500 rounded-xl p-4 shadow-sm relative overflow-hidden" },
                React.createElement("div", { className: "absolute top-0 right-0 p-2 opacity-10" }, 
                    React.cloneElement(ICONS.card, { className: "w-12 h-12" })
                ),
                React.createElement("div", { className: "flex items-start gap-4" },
                    React.createElement("img", { src: avatarUrl || DEFAULT_AVATAR_NEUTRAL, className: "w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" }),
                    React.createElement("div", { className: "flex-grow" },
                        React.createElement("p", { className: "text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1" }, "Datos de contacto compartidos"),
                        React.createElement("h3", { className: "text-lg font-bold text-gray-900 dark:text-white" }, name),
                        
                        React.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 mt-2 border-b dark:border-gray-700 pb-3" },
                            contactCard.phone && React.createElement("a", { href: `tel:${contactCard.phone}`, className: "flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 hover:text-blue-500 font-medium" }, 
                                ICONS.phone, contactCard.phone
                            ),
                            React.createElement("div", { className: "flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300" }, 
                                ICONS.location, React.createElement("span", null, React.createElement("strong", null, "Ciudad: "), location?.city || 'No especificada')
                            )
                        ),

                        React.createElement("div", { className: "mt-3 space-y-2" },
                            React.createElement("div", null,
                                React.createElement("p", { className: "text-xs font-bold text-gray-500 dark:text-gray-400 uppercase" }, "📍 Punto de encuentro sugerido por el usuario"),
                                contactCard.meetingPointAddress ? (
                                    React.createElement("div", { className: "mt-1" },
                                        React.createElement("button", { 
                                            onClick: () => navigate(`/meeting-map/${exchangeId}?type=preferred&userId=${partner.id}`),
                                            className: "text-sm text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1"
                                        }, "🗺️ " + contactCard.meetingPointAddress),
                                        contactCard.meetingPointComment && React.createElement("p", { className: "text-sm text-gray-600 dark:text-gray-400 italic mt-1" }, `"${contactCard.meetingPointComment}"`)
                                    )
                                ) : (
                                    React.createElement("p", { className: "text-sm text-gray-400" }, "No ha especificado un punto exacto.")
                                )
                            )
                        ),
                        
                        React.createElement("div", { className: "mt-4 flex flex-wrap gap-2 pt-3 border-t dark:border-gray-700" },
                            React.createElement("button", { 
                                onClick: () => navigate(`/meeting-map/${exchangeId}?type=midpoint`),
                                disabled: !hasLocationData,
                                className: `flex items-center gap-2 px-3 py-2 ${hasLocationData ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'} rounded-lg text-xs font-bold transition-colors`
                            }, React.createElement("span", { className: "text-base" }, "🧭"), hasLocationData ? "Ver Punto Medio Sugerido" : "Ubicación base no disponible")
                        )
                    )
                )
            )
        )
    );
};

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
        React.createElement(Link, { to: `/item/${item.id}`, className: "flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex-shrink-0 w-52 shadow-sm" },
            React.createElement("img", { src: item.imageUrls[0], alt: item.title, className: "w-10 h-10 rounded-md object-cover" }),
            React.createElement("div", { className: "flex-grow overflow-hidden" },
                React.createElement("p", { className: "text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400" }, isRequested ? `${exchange.owner.name} ofrece:` : `${exchange.requester.name} ofrece:`),
                React.createElement("p", { className: "text-sm font-semibold truncate" }, item.title)
            )
        )
    );
    const requestedItem = exchange.allItems.find(i => i.id === exchange.requestedItemId);
    const offeredItems = exchange.allItems.filter(i => exchange.offeredItemIds.includes(i.id));
    return React.createElement("div", { className: "bg-white dark:bg-gray-800 border-b dark:border-gray-700 shadow-sm" },
      React.createElement("div", { className: "flex items-center justify-start md:justify-center gap-4 flex-nowrap overflow-x-auto p-2 scrollbar-hide" },
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
        React.createElement("input", { type: "text", value: text, onChange: e => setText(e.target.value), placeholder: "Escribe tu mensaje...", className: "flex-grow appearance-none block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white", disabled: isLoading }),
        React.createElement(Button, { type: "submit", isLoading: isLoading, disabled: !text.trim(), className: "rounded-full !p-3 min-w-[80px]", children: "Enviar" })
    );
};

const ActionBar = ({ exchange, currentUser, onAccept, onReject, onConfirm, onModify, onCounterOffer, isLoading }) => {
    const isOwner = currentUser.id === exchange.owner.id;
    const isRequester = currentUser.id === exchange.requester.id;
    
    if (exchange.status === ExchangeStatus.Rejected) return React.createElement("div", { className: "p-3 bg-red-50 dark:bg-red-900/10 text-center font-bold text-red-600" }, "Propuesta Rechazada");
    if (exchange.status === ExchangeStatus.Cancelled) return React.createElement("div", { className: "p-3 bg-gray-100 dark:bg-gray-800 text-center font-bold" }, "Intercambio Cancelado");
    
    if (exchange.status === ExchangeStatus.Pending) {
        if (isOwner) return React.createElement("div", { className: "p-4 bg-gray-50 dark:bg-gray-800/50 flex flex-wrap justify-center gap-4" }, React.createElement(Button, { onClick: onAccept, size: "sm", children: "Aceptar Intercambio" }), React.createElement(Button, { onClick: onReject, variant: "danger", size: "sm", children: "Rechazar" }), React.createElement(Button, { onClick: onCounterOffer, variant: "secondary", size: "sm", children: "Contraoferta" }));
        if (isRequester) return React.createElement("div", { className: "p-4 text-center bg-gray-50 dark:bg-gray-800/50" }, React.createElement("p", {className:"mb-3 text-sm text-gray-600 dark:text-gray-400 font-medium"}, "Esperando respuesta del propietario..."), React.createElement(Button, { onClick: onModify, variant: "secondary", size: "sm", className: "mx-auto", children: "Modificar Oferta" }));
    }
    
    if (exchange.status === ExchangeStatus.Accepted) {
        const acceptedDate = exchange.acceptedAt ? new Date(exchange.acceptedAt) : new Date();
        const now = new Date();
        const diffMs = now.getTime() - acceptedDate.getTime();
        const isNextDay = diffMs >= 24 * 60 * 60 * 1000;

        if (!isNextDay) {
            return React.createElement("div", { className: "p-4 text-center bg-blue-50 dark:bg-blue-900/20 border-t dark:border-gray-700" },
                React.createElement("p", { className: "text-sm font-bold text-blue-800 dark:text-blue-200" }, 
                    "¡Propuesta aceptada! Podréis votar una vez completado el trueque 24 horas después de haberlo aceptado."
                )
            );
        }

        return React.createElement("div", { className: "p-4 text-center bg-blue-50 dark:bg-blue-900/20 border-t dark:border-gray-700" },
            React.createElement(Button, { 
                onClick: onConfirm, 
                size: "sm", 
                className: "w-full max-w-md mx-auto py-3",
                children: "Intercambio realizado, proceder a las votaciones" 
            })
        );
    }
    return null;
};

const ChatDetailPage = () => {
    const { exchangeId } = useParams();
    const { user: currentUser } = useAuth();
    const { showConfetti } = useConfetti();
    const { showToast } = useToast();
    const { theme } = useColorTheme();
    const navigate = useNavigate();
    
    const [chat, setChat] = useState(null);
    const [exchange, setExchange] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [isModifyModalOpen, setIsModifyModalOpen] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [isBanModalOpen, setIsBanModalOpen] = useState(false);
    const [userToBan, setUserToBan] = useState(null);

    const messagesEndRef = useRef(null);
    const prevStatusRef = useRef(null);
    const confettiFiredRef = useRef(false);
    
    const scrollToBottom = (behavior = "smooth") => messagesEndRef.current?.scrollIntoView({ behavior });
    
    const fetchData = useCallback(async (isInitialLoad = false) => {
        if (!exchangeId || !currentUser) return;
        try {
            if (isInitialLoad) setLoading(true);
            const { chat: fetchedChat, exchange: fetchedExchange } = await api.getChatAndExchangeDetails(exchangeId);
            setChat(fetchedChat);
            setExchange(fetchedExchange);
            
            await api.markChatAsRead(exchangeId);

            if (isInitialLoad) setError(null);
        } catch (err) {
            if (isInitialLoad) setError('Error al cargar el chat.');
        } finally {
            if (isInitialLoad) setLoading(false);
        }
    }, [exchangeId, currentUser]);

    useEffect(() => {
        let isMounted = true;
        fetchData(true).then(() => { if (isMounted) setTimeout(() => scrollToBottom("auto"), 200); });
        const intervalId = setInterval(() => { if (isMounted) fetchData(false); }, 3000); 
        return () => { isMounted = false; clearInterval(intervalId); };
    }, [fetchData]);

    useEffect(() => {
        if (exchange?.status === ExchangeStatus.Accepted) {
            if (!confettiFiredRef.current) {
                showConfetti();
                confettiFiredRef.current = true;
            }
        }
        if (exchange) {
            prevStatusRef.current = exchange.status;
        }
    }, [exchange?.status, showConfetti]);

    useEffect(() => {
        scrollToBottom();
    }, [chat?.messages]);

    const handleAction = async (actionFn) => {
        setActionLoading(true);
        try { await actionFn(); await fetchData(false); } catch (err) { setError(err.message); } finally { setActionLoading(false); }
    };
    
    const handleSendMessage = (text) => handleAction(() => api.sendMessage(exchangeId, text));
    const handleAccept = () => handleAction(() => api.respondToExchange(exchangeId, 'ACCEPT'));
    const handleReject = () => handleAction(() => api.respondToExchange(exchangeId, 'REJECT'));
    const handleNavigateToRating = () => navigate(`/rate-exchange/${exchangeId}`);
    const handleModify = async () => setIsModifyModalOpen(true); 
    const handleSubmitModification = (data) => { setIsModifyModalOpen(false); handleAction(() => api.modifyExchangeProposal(exchangeId, data)); };
    const handleCounterOffer = () => navigate(`/user/${exchange.requester.id}?fromExchange=${exchange.id}`);

    const handleBanClick = (user) => {
        if (user.isBanned) handleBanConfirm(user.id, null);
        else { setUserToBan(user); setIsBanModalOpen(true); }
    };

    const handleBanConfirm = async (reasonOrId, details = null) => {
        const userId = userToBan ? userToBan.id : reasonOrId;
        try {
            await api.banUser(userId, userToBan ? reasonOrId : null, details);
            showToast('Estado de usuario actualizado.', 'success');
            setIsBanModalOpen(false);
            setUserToBan(null);
            fetchData(false);
        } catch(e) { showToast(e.message, 'error'); }
    };

    const handleCensorMessage = async (messageId) => {
        if(window.confirm("¿Censurar este mensaje?")) {
            try { await api.censorMessage(exchangeId, messageId); fetchData(false); } catch(e) { alert(e.message); }
        }
    };

    const handleReport = async (reason) => {
        try {
            await api.reportContent(exchange.id, 'CHAT', reason);
            showToast('Reporte enviado correctamente.', 'success');
        } catch (err) { showToast(err.message || 'Error al enviar reporte.', 'error'); }
    };

    if (loading) return React.createElement("div", { className: "flex justify-center items-center h-64" }, React.createElement(SwapSpinner, null));
    if (error) return React.createElement("div", { className: "text-center text-red-500 py-10" }, error);
    if (!chat || !exchange || !currentUser) return React.createElement("div", { className: "text-center py-10" }, "Chat no disponible.");

    const isViewingAsAdmin = currentUser.role === 'SUPER_ADMIN';
    const partner = exchange.ownerId === currentUser.id ? exchange.requester : exchange.owner;
    const isOtherUserBanned = partner?.isBanned;
    const isAccepted = exchange.status === ExchangeStatus.Accepted || exchange.status === ExchangeStatus.Completed;

    return (
        React.createElement("div", { className: "flex flex-col h-[calc(100vh_-_8rem)] bg-white dark:bg-gray-900 max-w-4xl mx-auto rounded-xl shadow-2xl border dark:border-gray-700 overflow-hidden" },
            React.createElement(BanUserModal, { isOpen: isBanModalOpen, onClose: () => setIsBanModalOpen(false), onConfirm: handleBanConfirm, userName: userToBan?.name || '' }),
            React.createElement(ReportModal, { isOpen: isReportModalOpen, onClose: () => setIsReportModalOpen(false), title: "Reportar Chat", onSubmit: handleReport }),
            
            React.createElement("div", { className: "p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex justify-between items-center" },
                React.createElement("div", { className: "flex items-center gap-3" },
                    React.createElement(Link, { to: `/user/${partner.id}` },
                        React.createElement("img", { src: partner?.avatarUrl || DEFAULT_AVATAR_NEUTRAL, className: `w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm ${partner?.isBanned ? 'grayscale opacity-50' : ''}` })
                    ),
                    React.createElement("div", null,
                        React.createElement("h1", { className: "text-base font-bold leading-tight" }, partner?.name),
                        React.createElement("p", { className: "text-[10px] text-gray-500 font-bold uppercase" }, isViewingAsAdmin ? "VISTA DE ADMINISTRADOR" : "Socio de trueque")
                    )
                ),
                !isViewingAsAdmin && !isOtherUserBanned && (
                    React.createElement("button", { onClick: () => setIsReportModalOpen(true), className: "text-gray-400 hover:text-red-500 p-2 transition-colors" }, ICONS.flag)
                )
            ),
            
            !isViewingAsAdmin && isOtherUserBanned && (
                React.createElement("div", { className: "bg-red-600 text-white p-2 text-center text-xs font-bold" }, "USUARIO SUSPENDIDO - CHAT CONGELADO")
            ),
            
            React.createElement(MemoizedItemBar, { exchange: exchange }),
            
            React.createElement("div", { className: "flex-grow overflow-y-auto p-4 flex flex-col bg-gray-50 dark:bg-gray-900/50" },
                isAccepted && !isOtherUserBanned && React.createElement(ContactCard, { 
                    partner: partner,
                    exchangeId: exchangeId,
                    theme: theme
                }),
                React.createElement("div", { className: "space-y-4 flex flex-col" },
                    chat.messages.map(msg => {
                        const sender = msg.senderId === exchange.owner?.id ? exchange.owner : exchange.requester;
                        return React.createElement(Message, { 
                            key: msg.id, 
                            message: msg, 
                            senderName: sender?.name || 'Usuario', 
                            isOwnMessage: msg.senderId === currentUser.id,
                            isAdminView: isViewingAsAdmin,
                            onCensor: handleCensorMessage
                        })
                    }),
                    React.createElement("div", { ref: messagesEndRef })
                )
            ),

            !isViewingAsAdmin && !isOtherUserBanned && React.createElement(ActionBar, { 
                exchange: exchange, 
                currentUser: currentUser,
                onAccept: handleAccept,
                onReject: handleReject,
                onConfirm: handleNavigateToRating,
                onModify: handleModify,
                onCounterOffer: handleCounterOffer,
                isLoading: actionLoading
            }),
            
            !isViewingAsAdmin && !isOtherUserBanned && !isAccepted && exchange.status === ExchangeStatus.Pending && (
                React.createElement(MessageInput, { onSendMessage: handleSendMessage, isLoading: actionLoading })
            ),
            
            isAccepted && !isOtherUserBanned && (
                React.createElement(MessageInput, { onSendMessage: handleSendMessage, isLoading: actionLoading })
            ),
            
            isModifyModalOpen && (
                React.createElement(ExchangeProposalModal, {
                    isOpen: isModifyModalOpen,
                    onClose: () => setIsModifyModalOpen(false),
                    userItems: [], 
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
