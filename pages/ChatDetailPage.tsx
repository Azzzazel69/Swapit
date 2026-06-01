
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api, DEFAULT_AVATAR_NEUTRAL } from '../services/api.ts';
import { db } from '../firebase.ts';
import { onSnapshot, doc } from 'firebase/firestore';
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

const ItemCardSmall = ({ item }: { item: any }) => {
    return React.createElement("div", { className: "flex items-center gap-3 p-2 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm transition-all hover:shadow-md" },
        React.createElement("div", { className: "w-12 h-12 rounded-md overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-gray-800" },
            React.createElement("img", { 
                src: item.imageUrls?.[0] || DEFAULT_AVATAR_NEUTRAL, 
                alt: item.title,
                className: "w-full h-full object-cover",
                referrerPolicy: "no-referrer"
            })
        ),
        React.createElement("div", { className: "flex-1 min-w-0" },
            React.createElement("p", { className: "text-xs font-bold text-gray-900 dark:text-white truncate" }, item.title),
            React.createElement("p", { className: "text-[10px] text-gray-500 dark:text-gray-400 truncate" }, item.category)
        )
    );
};

const Message = ({ message, senderName, isOwnMessage, isAdminView, onCensor, onImageClick, onReport }: { message: any, senderName: string, isOwnMessage: boolean, isAdminView: boolean, onCensor: (id: string) => void, onImageClick: (url: string) => void, onReport: (id: string) => void }) => {
    const [showBlurred, setShowBlurred] = useState(false);
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
    
    return React.createElement("div", { className: `group flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} relative mb-2` },
        React.createElement("div", { className: `max-w-[85%] sm:max-w-md rounded-2xl px-4 py-2 ${bubbleClasses} shadow-sm relative` },
            !isOwnMessage && React.createElement("p", { className: "text-[10px] font-black uppercase mb-1 opacity-70" }, senderName),
            
            message.image && (
                React.createElement("div", { className: "relative mb-2 rounded-xl overflow-hidden cursor-pointer", onClick: () => onImageClick(message.image) },
                    React.createElement("img", { 
                        src: message.image || undefined, 
                        className: `max-w-full h-auto rounded-xl transition-all duration-500 ${message.flagged && !showBlurred ? 'blur-2xl scale-110' : 'hover:scale-105'}` 
                    } as any),
                    message.flagged && !showBlurred && React.createElement("div" as any, { className: "absolute inset-0 flex flex-col items-center justify-center bg-black/40 p-4 text-center", onClick: (e: any) => e.stopPropagation() } as any,
                        React.createElement("span", { className: "text-2xl mb-2" }, "⚠️"),
                        React.createElement("p", { className: "text-[10px] font-bold text-white mb-2" }, "Contenido potencialmente sensible"),
                        React.createElement("button", { 
                            onClick: () => setShowBlurred(true),
                            className: "px-3 py-1 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full text-[10px] font-bold text-white border border-white/30 transition-all"
                        }, "Ver imagen")
                    )
                )
            ),
            
            message.text && (
                React.createElement("div", { className: "relative" },
                    React.createElement("p", { className: `text-sm leading-relaxed break-words transition-all duration-500 ${message.flagged && !message.image && !showBlurred ? 'blur-md select-none' : ''}` }, message.text),
                    message.flagged && !message.image && !showBlurred && React.createElement("div", { className: "absolute inset-0 flex items-center justify-center" },
                        React.createElement("button", { 
                            onClick: () => setShowBlurred(true),
                            className: "px-3 py-1 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full text-[10px] font-bold text-white border border-white/30 transition-all shadow-sm"
                        }, "Ver mensaje")
                    )
                )
            ),

            !isOwnMessage && React.createElement("button", {
                onClick: () => onReport(message.id),
                className: "absolute -right-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
            }, "🚩")
        ),
        React.createElement("p", { className: "text-[9px] font-bold text-gray-400 mt-1 uppercase tracking-tighter" }, 
            new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        ),
        isAdminView && (
            React.createElement("button", { onClick: () => onCensor(message.id), className: "absolute -right-8 top-2 opacity-0 group-hover:opacity-100" }, "🚫")
        )
    );
};

const ChatDetailPage = () => {
    const { exchangeId } = useParams();
    const { user: currentUser } = useAuth();
    const { showToast } = useToast();
    const { theme } = useColorTheme();
    const { showConfetti } = useConfetti();
    const navigate = useNavigate();
    
    const [chat, setChat] = useState(null);
    const [exchange, setExchange] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [fullscreenImage, setFullscreenImage] = useState(null);
    const [reportTarget, setReportTarget] = useState(null); // { id, type }
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchData = useCallback(async () => {
        try {
            const data = await api.getChatAndExchangeDetails(exchangeId);
            setChat(data.chat);
            setExchange(data.exchange);
        } catch (e) { showToast("Error cargando chat", "error"); }
        finally { setLoading(false); }
    }, [exchangeId]);

    useEffect(() => {
        fetchData();
        const unsubChat = api.subscribeToChat(exchangeId, (newChat) => {
            setChat(newChat);
        });
        const unsubExchange = api.subscribeToExchange(exchangeId, (newExchange) => {
            setExchange(prev => prev ? { ...prev, ...newExchange } : newExchange);
        });
        return () => {
            unsubChat();
            unsubExchange();
        };
    }, [exchangeId, fetchData]);

    useEffect(() => { scrollToBottom(); }, [chat?.messages]);

    useEffect(() => {
        if (!exchange || !currentUser) return;
        const partnerId = exchange.ownerId === currentUser.id ? exchange.requesterId : exchange.ownerId;
        if (!partnerId) return;

        const unsubPartner = onSnapshot(doc(db, 'users', partnerId), (snap) => {
            if (snap.exists()) {
                const partnerData = { id: snap.id, ...snap.data() };
                setExchange(prev => {
                    if (!prev) return prev;
                    const isOwner = prev.ownerId === currentUser.id;
                    return {
                        ...prev,
                        owner: isOwner ? prev.owner : partnerData,
                        requester: isOwner ? partnerData : prev.requester
                    };
                });
            }
        });

        return () => unsubPartner();
    }, [exchange?.ownerId, exchange?.requesterId, currentUser?.id]);

    const handleSendMessage = async (text, image = null) => {
        if (!text.trim() && !image) return;
        
        // Disable action loading for text to allow fast typing
        if (image) {
            setActionLoading(true);
        }

        // Optimistic UI Update
        const tempId = `msg-${Date.now()}-temp`;
        const newMessage = {
            id: tempId,
            senderId: currentUser.id,
            text,
            image, // This will be base64 or undefined
            timestamp: new Date().toISOString(),
            isOptimistic: true
        };

        setChat(prev => {
            if (!prev) return { id: exchangeId, messages: [newMessage] };
            return {
                ...prev,
                messages: [...(prev?.messages || []), newMessage]
            };
        });

        try {
            const partnerId = exchange?.ownerId === currentUser.id ? exchange?.requesterId : exchange?.ownerId;
            await api.sendMessage(exchangeId, text, image, partnerId);
        } catch (err: any) {
            showToast(err.message, "error");
            // Basic rollback on error
            setChat(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    messages: (prev.messages || []).filter(m => m.id !== tempId)
                };
            });
        } finally {
            if (image) {
                setActionLoading(false);
            }
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        try {
            setActionLoading(true);
            const resized = await api.resizeImageBeforeUpload(file);
            await handleSendMessage("", resized);
        } catch (err: any) {
            showToast("Error al subir imagen", "error");
        } finally {
            setActionLoading(false);
            e.target.value = null;
        }
    };

    const handleUpdateStatus = async (status) => {
        let cancelReason = '';
        if (status === ExchangeStatus.Cancelled) {
            cancelReason = window.prompt("Por favor, indica el motivo de la cancelación:") || "";
            if (!cancelReason.trim()) {
                showToast("Debes indicar un motivo para cancelar.", "error");
                return;
            }
        }
        
        setActionLoading(true);
        try {
            await api.updateExchangeStatus(exchangeId, status, cancelReason);
            if (status === ExchangeStatus.Accepted) {
                showConfetti();
                showToast("¡Intercambio aceptado! Acordad un punto de encuentro.", "success");
            } else if (status === ExchangeStatus.Cancelled) {
                showToast("Transacción cancelada.", "info");
            }
        } catch (err: any) {
            showToast(err.message, "error");
        } finally {
            setActionLoading(false);
        }
    };

    const handleReportSubmit = async (reason, details) => {
        if (!reportTarget) return;
        try {
            await api.reportContent(reportTarget.id, reportTarget.type, reason, details);
            showToast("Reporte enviado con éxito", "success");
        } catch (err) {
            showToast(err instanceof Error ? err.message : "Error al enviar reporte", "error");
        } finally {
            setReportTarget(null);
        }
    };

    // Debug logging para el usuario
    useEffect(() => {
        if (exchange && currentUser) {
            console.log("ChatDetailPage State:", {
                exchangeId,
                status: exchange.status,
                isPending: exchange.status?.toUpperCase() === 'PENDING',
                ownerId: exchange.ownerId,
                requesterId: exchange.requesterId,
                currentUserId: currentUser.id,
                isOwner: exchange.ownerId === currentUser.id,
                isRequester: exchange.requesterId === currentUser.id
            });
        }
    }, [exchange, currentUser, exchangeId]);

    if (loading) return React.createElement(SwapSpinner, { size: 'lg' });
    if (!chat || !exchange) return React.createElement("div", { className: "p-10 text-center" }, "No se encontró el chat.");
    if (!currentUser) return React.createElement("div", { className: "p-10 text-center" }, "Inicia sesión para ver este chat.");

    const partner = exchange.ownerId === currentUser.id ? exchange.requester : exchange.owner;
    
    if (!partner) {
        return React.createElement("div", { className: "p-10 text-center" }, "No se pudo cargar la información del otro usuario.");
    }

    const isOwner = exchange.ownerId === currentUser.id;
    const isRequester = exchange.requesterId === currentUser.id;
    const isPending = exchange.status?.toUpperCase() === 'PENDING';

    const isOnline = partner.lastSeen ? (new Date().getTime() - new Date(partner.lastSeen).getTime() < 120000) : false;

    return React.createElement("div", { className: "flex flex-col h-[100dvh] max-w-4xl mx-auto bg-white dark:bg-gray-900 shadow-xl overflow-hidden relative" },
            // Modales
            React.createElement(ReportModal, { 
                isOpen: !!reportTarget, 
                onClose: () => setReportTarget(null), 
                title: reportTarget?.type === 'USER' ? "Reportar Usuario" : "Reportar Mensaje",
                type: reportTarget?.type || 'MESSAGE',
                onSubmit: handleReportSubmit 
            }),

            // Visor de imagen a pantalla completa
            fullscreenImage && React.createElement("div", { 
                className: "fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 animate-fade-in",
                onClick: () => setFullscreenImage(null)
            },
                React.createElement("button", { className: "absolute top-6 right-6 text-white text-3xl p-2" }, "✕"),
                React.createElement("img" as any, { 
                    src: fullscreenImage, 
                    className: "max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-scale-in",
                    onClick: (e: any) => e.stopPropagation()
                })
            ),

            // Header del Chat
            React.createElement("div", { className: "p-4 border-b dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800 z-10 shadow-sm" },
                React.createElement("div", { className: "flex items-center gap-3" },
                    React.createElement("button", { onClick: () => navigate(-1), className: "p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors" }, 
                        React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" }, React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M15 19l-7-7 7-7" }))
                    ),
                    React.createElement(Link, { to: `/user/${partner.id}`, className: "flex items-center gap-3 group" },
                        React.createElement("img", { src: partner.avatarUrl || DEFAULT_AVATAR_NEUTRAL, className: "w-10 h-10 rounded-full object-cover border-2 border-gray-100 dark:border-gray-600 group-hover:scale-105 transition-transform" }),
                        React.createElement("div", null,
                            React.createElement("div", { className: "flex items-center gap-2" },
                                React.createElement("h1", { className: "font-black text-gray-900 dark:text-white leading-none" }, partner.name || 'Usuario'),
                                partner.ratings && partner.ratings.length > 0 && React.createElement("div", { className: "flex items-center gap-1 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded-md" },
                                    React.createElement("span", { className: "text-[10px]" }, "⭐"),
                                    React.createElement("span", { className: "text-xs font-black text-gray-700 dark:text-gray-300" }, Math.round(partner.ratings.reduce((acc, r) => acc + r.rating, 0) / partner.ratings.length))
                                )
                            ),
                            React.createElement("p", { className: `text-[10px] ${isOnline ? 'text-green-500' : 'text-gray-400'} font-bold uppercase mt-1` }, isOnline ? "En línea" : "Desconectado")
                        )
                    )
                ),
                React.createElement("div", { className: "flex items-center gap-2" },
                    React.createElement("button", { 
                        onClick: () => setReportTarget({ id: partner.id, type: 'USER' }),
                        className: "p-2 text-gray-400 hover:text-red-500 transition-colors",
                        title: "Reportar Usuario"
                    }, "🚩"),
                    exchange.status === ExchangeStatus.Accepted && React.createElement(Link, { 
                        to: `/meeting-map/${exchangeId}`,
                        className: `flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-black border border-blue-100 dark:border-blue-800 hover:scale-105 transition-transform shadow-sm`
                    }, 
                        React.createElement("span", { className: "text-lg" }, "📍"), 
                        "Mapa"
                    ),
                    exchange.status === ExchangeStatus.Completed && (!exchange.ratedBy || !exchange.ratedBy.includes(currentUser?.id)) && React.createElement(Link, { 
                        to: `/rate-exchange/${exchangeId}`,
                        className: "px-3 py-1.5 rounded-lg bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs font-black border border-green-100 dark:border-green-800 hover:scale-105 transition-transform"
                    }, "Valorar")
                )
            ),

            // Resumen del Intercambio
            React.createElement("div", { className: "p-4 bg-gray-50 dark:bg-gray-800/50 border-b dark:border-gray-700" },
                React.createElement("div", { className: "flex items-center justify-between gap-4" },
                    // Artículo solicitado (El artículo del dueño)
                    exchange.requestedItem && React.createElement("div", { className: "flex-1" },
                        React.createElement("p", { className: "text-[10px] font-black text-gray-400 uppercase mb-1" }, isOwner ? "Tu artículo" : "Solicitas"),
                        React.createElement(Link, { 
                            to: `/item/${exchange.requestedItem.id}`,
                            className: "flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 hover:border-blue-500 transition-all group"
                        },
                            React.createElement("img", { src: exchange.requestedItem.imageUrls?.[0] || DEFAULT_AVATAR_NEUTRAL, className: "w-10 h-10 rounded-lg object-cover group-hover:scale-105 transition-transform" }),
                            React.createElement("p", { className: "text-xs font-bold truncate group-hover:text-blue-500 transition-colors" }, exchange.requestedItem.title)
                        )
                    ),
                    
                    React.createElement("div", { className: "flex flex-col items-center" },
                        React.createElement("span", { className: "text-xl animate-pulse" }, "🔄"),
                    ),

                    // Artículos ofrecidos (Los artículos del solicitante)
                    React.createElement("div", { className: "flex-1" },
                        React.createElement("p", { className: "text-[10px] font-black text-gray-400 uppercase mb-1" }, isOwner ? "Te ofrecen" : "Ofreces"),
                        React.createElement("div", { className: "flex flex-col gap-1" },
                            exchange.offeredItems?.map((item: any, idx: number) => {
                                const isOther = item.id?.startsWith('other-');
                                const content = React.createElement("div", { className: "flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 hover:border-blue-500 transition-all group" },
                                    React.createElement("img", { src: item.imageUrls?.[0] || DEFAULT_AVATAR_NEUTRAL, className: "w-10 h-10 rounded-lg object-cover group-hover:scale-105 transition-transform" }),
                                    React.createElement("p", { className: "text-xs font-bold truncate group-hover:text-blue-500 transition-colors" }, item.title)
                                );

                                if (isOther) return React.createElement("div", { key: item.id || idx }, content);
                                return React.createElement(Link, { key: item.id || idx, to: `/item/${item.id}` }, content);
                            })
                        )
                    )
                )
            ),

            // Banner de Estado
            React.createElement("div", { className: "bg-yellow-50 dark:bg-yellow-900/20 p-4 border-b border-yellow-100 dark:border-yellow-800 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in-up" },
                React.createElement("div", null,
                    React.createElement("div", { className: "flex items-center gap-2 mb-1" },
                        React.createElement("span", { className: `px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${isOwner ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}` }, 
                            isOwner ? "Dueño del artículo" : "Solicitante"
                        ),
                        isPending && React.createElement("span", { className: "animate-pulse w-2 h-2 rounded-full bg-yellow-400" })
                    ),
                    React.createElement("p", { className: "text-sm font-bold text-yellow-800 dark:text-yellow-200" }, 
                        isPending 
                            ? (isOwner ? "¿Aceptas este intercambio?" : "Propuesta enviada. Esperando respuesta...")
                            : `Estado: ${exchange.status === 'ACCEPTED' ? 'ACEPTADO - Acordad la entrega' : exchange.status}`
                    ),
                    React.createElement("p", { className: "text-xs text-yellow-600 dark:text-yellow-400" }, 
                        isPending 
                            ? (isOwner ? "Revisa los artículos propuestos antes de decidir." : "Puedes seguir negociando por el chat.")
                            : (exchange.status === 'ACCEPTED' ? "Cuando hayáis realizado el intercambio, márcalo como completado." : "")
                    )
                ),
                React.createElement("div", { className: "flex gap-2" },
                    isPending && isOwner && (
                        React.createElement(React.Fragment, null,
                            React.createElement(Button, { size: "sm", variant: "success", onClick: () => handleUpdateStatus(ExchangeStatus.Accepted), children: "Aceptar" }),
                            React.createElement(Button, { size: "sm", variant: "danger", onClick: () => handleUpdateStatus(ExchangeStatus.Rejected), children: "Rechazar" })
                        )
                    ),
                    isPending && isRequester && (
                        React.createElement(Button, { size: "sm", variant: "danger", onClick: () => handleUpdateStatus(ExchangeStatus.Cancelled), children: "Cancelar Propuesta" })
                    ),
                    exchange.status?.toUpperCase() === 'ACCEPTED' && (
                        React.createElement(React.Fragment, null,
                            React.createElement(Button, { size: "sm", variant: "danger", onClick: () => handleUpdateStatus(ExchangeStatus.Cancelled), children: "Cancelar Transacción" }),
                            React.createElement(Button, { size: "sm", onClick: () => handleUpdateStatus(ExchangeStatus.Completed), children: "Marcar como Completado" })
                        )
                    )
                )
            ),

            exchange.cashPlus > 0 && React.createElement("div", { className: "bg-blue-50 dark:bg-blue-900/20 p-3 border-b border-blue-100 dark:border-blue-800 flex items-center justify-center gap-2" },
                React.createElement("span", { className: "text-xl" }, "💶"),
                React.createElement("p", { className: "text-sm font-black text-blue-700 dark:text-blue-300" }, 
                    `Esta propuesta incluye un plus de ${exchange.cashPlus}€`
                )
            ),

            // Mensajes
            React.createElement("div", { className: "flex-grow overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-950/50" },
                chat.messages.map(m => React.createElement(Message, { 
                    key: m.id, 
                    message: m, 
                    isOwnMessage: m.senderId === currentUser.id, 
                    senderName: partner.name || 'Usuario',
                    isAdminView: false,
                    onCensor: () => {},
                    onImageClick: setFullscreenImage,
                    onReport: (id) => setReportTarget({ id, type: 'MESSAGE' })
                })),
                React.createElement("div", { ref: messagesEndRef })
            ),

            // Input de Mensaje
            React.createElement("div", { className: "p-4 bg-white dark:bg-gray-800 border-t dark:border-gray-700" },
                React.createElement("form", { 
                    onSubmit: (e: any) => { e.preventDefault(); const t = (e.target as any).msg.value; handleSendMessage(t); (e.target as any).msg.value = ''; },
                    className: "flex gap-2 items-center"
                } as any,
                    React.createElement("label", { className: "p-3 rounded-2xl bg-gray-100 dark:bg-gray-700 text-gray-500 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors" },
                        React.createElement("span", { className: "text-xl" }, "📷"),
                        React.createElement("input", { type: "file", className: "hidden", accept: "image/*", onChange: handleImageUpload, disabled: actionLoading })
                    ),
                    React.createElement("input", { 
                        name: "msg", 
                        autoComplete: "off",
                        className: "flex-grow p-3 text-sm bg-gray-100 dark:bg-gray-700 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 dark:text-white transition-all", 
                        placeholder: "Escribe un mensaje..." 
                    }),
                    React.createElement("button", { 
                        type: "submit", 
                        disabled: actionLoading,
                        className: `p-3 rounded-2xl bg-blue-500 text-white shadow-lg hover:scale-110 active:scale-90 transition-all disabled:opacity-50`
                    }, 
                        actionLoading ? React.createElement(SwapSpinner, { size: 'sm' }) : ICONS.send
                    )
                )
            )
        );
};

export default ChatDetailPage;
