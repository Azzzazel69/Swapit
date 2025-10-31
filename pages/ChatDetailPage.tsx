import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api.ts';
import { useAuth } from '../hooks/useAuth.tsx';
import Spinner from '../components/Spinner.tsx';
import Button from '../components/Button.tsx';
import { useColorTheme } from '../hooks/useColorTheme.tsx';
import { ExchangeStatus } from '../types.ts';
import Confetti from '../components/Confetti.tsx';

const DealCompletedInfo = ({ exchange, currentUser }) => {
    const otherUser = currentUser.id === exchange.owner.id ? exchange.requester : exchange.owner;
    
    return (
        React.createElement("div", { className: "text-center p-4 my-4 bg-green-50 dark:bg-green-900/50 border-2 border-dashed border-green-400 rounded-lg" },
            React.createElement("h2", { className: "text-2xl font-bold text-green-700 dark:text-green-300" }, "¡Felicidades, tienes un trato!"),
            React.createElement("p", { className: "mt-2 text-gray-600 dark:text-gray-300" }, "Aquí están los datos de contacto para coordinar el intercambio:"),
            React.createElement("div", { className: "mt-4 text-left inline-block bg-white dark:bg-gray-800 p-4 rounded-md shadow" },
                React.createElement("p", null, React.createElement("strong", null, "Nombre:"), " ", otherUser.name),
                React.createElement("p", null, React.createElement("strong", null, "Email:"), " ", otherUser.email),
                React.createElement("p", null, React.createElement("strong", null, "Teléfono:"), " ", otherUser.phone),
                React.createElement("p", null, React.createElement("strong", null, "Dirección:"), ` ${otherUser.location.address}, ${otherUser.location.city}, ${otherUser.location.postalCode}`)
            )
        )
    );
};

const ConfirmationSection = ({ exchange, currentUser, onConfirm, isConfirming }) => {
    const isOwner = currentUser.id === exchange.owner.id;
    const hasCurrentUserConfirmed = isOwner ? exchange.confirmedByOwner : exchange.confirmedByRequester;
    const hasOtherUserConfirmed = isOwner ? exchange.confirmedByRequester : exchange.confirmedByOwner;
    const otherUser = isOwner ? exchange.requester : exchange.owner;

    return (
        React.createElement("div", { className: "text-center p-4 my-4 bg-blue-50 dark:bg-blue-900/50 border-2 border-dashed border-blue-400 rounded-lg" },
            React.createElement("h2", { className: "text-2xl font-bold text-blue-700 dark:text-blue-300" }, "¡Propuesta Aceptada!"),
            React.createElement("p", { className: "mt-2 text-gray-600 dark:text-gray-300" }, "Ambos deben confirmar el intercambio para finalizar el trato y recibir los datos de contacto."),
            
            React.createElement("div", { className: "mt-4 flex flex-col sm:flex-row justify-around items-center gap-4" },
                // Current User Status
                React.createElement("div", { className: "text-center p-2 rounded-md w-full sm:w-auto" },
                    React.createElement("p", { className: "font-semibold mb-2" }, "Tú (", React.createElement("span", {className: "italic"}, currentUser.name), ")"),
                    hasCurrentUserConfirmed ? (
                        React.createElement("p", { className: "text-green-600 dark:text-green-400 font-bold flex items-center gap-2 justify-center" }, 
                            React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-5 w-5", viewBox: "0 0 20 20", fill: "currentColor" }, React.createElement("path", { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z", clipRule: "evenodd" })),
                            "Confirmado"
                        )
                    ) : (
                        React.createElement(Button, { onClick: onConfirm, isLoading: isConfirming, children: "Confirmar Intercambio" })
                    )
                ),
                // Other User Status
                React.createElement("div", { className: "text-center p-2 rounded-md w-full sm:w-auto" },
                    React.createElement("p", { className: "font-semibold mb-2" }, otherUser.name),
                     hasOtherUserConfirmed ? (
                        React.createElement("p", { className: "text-green-600 dark:text-green-400 font-bold flex items-center gap-2 justify-center" }, 
                            React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-5 w-5", viewBox: "0 0 20 20", fill: "currentColor" }, React.createElement("path", { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z", clipRule: "evenodd" })),
                           "Confirmado"
                        )
                    ) : (
                        React.createElement("p", { className: "text-yellow-600 dark:text-yellow-400 font-bold flex items-center gap-2 justify-center" },
                            React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-5 w-5 animate-pulse", viewBox: "0 0 20 20", fill: "currentColor" }, React.createElement("path", { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z", clipRule: "evenodd" })),
                           "Pendiente de confirmación"
                        )
                    )
                )
            )
        )
    );
};

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
    const [isConfirming, setIsConfirming] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    const messagesEndRef = useRef(null);
    const hasTriggeredConfetti = useRef(false);

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
        const hasLocal = typeof window !== 'undefined' && window.localStorage;
        if (!hasLocal || !exchange || !user) return;

        if (exchange.status === ExchangeStatus.Completed && !hasTriggeredConfetti.current) {
            const seenDeals = JSON.parse(localStorage.getItem('seen_completed_deals') || '[]');
            if (!seenDeals.includes(exchange.id)) {
                setShowConfetti(true);
                hasTriggeredConfetti.current = true;
                seenDeals.push(exchange.id);
                localStorage.setItem('seen_completed_deals', JSON.stringify(seenDeals));
            }
        }
    }, [exchange, user]);


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

    const handleConfirmSwap = async () => {
        if (!exchangeId) return;
        setIsConfirming(true);
        try {
            await api.confirmFinalExchange(exchangeId);
            await fetchChatDetails();
        } catch (err) {
            setError(err.message);
        } finally {
            setIsConfirming(false);
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
                React.createElement(NegotiationItemCard, { item: requestedItem, isRequested: true, exchange: exchange, user: user, onUpdate: handleUpdateItemStatus, isUpdating: updatingItemId === requestedItem?.id }),
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
        if (!item) return null;
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
        
        const isInitialProposal = chat.messages.findIndex(m => m.type === 'PROPOSAL') === chat.messages.indexOf(message);
        if (isInitialProposal && !message.text) return null; 

        return React.createElement("div", { key: message.id, className: `flex ${isCurrentUser ? 'justify-end' : 'justify-start'}` },
            React.createElement("div", { className: `max-w-xs lg:max-w-md p-3 rounded-lg ${isCurrentUser ? `bg-gradient-to-r ${theme.bg} text-white` : 'bg-gray-200 dark:bg-gray-700'}` },
                React.createElement("p", { className: "text-sm" }, message.text)
            )
        );
    };

    return React.createElement("div", { className: "flex flex-col h-full" },
        showConfetti && React.createElement(Confetti, { show: true }),
        React.createElement("div", { className: "flex items-center p-3 border-b dark:border-gray-700" },
            React.createElement("button", { onClick: () => navigate('/exchanges'), className: `mr-3 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700` },
                React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-5 w-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" },
                    React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M10 19l-7-7m0 0l7-7m-7 7h18" })
                )
            ),
            React.createElement("h2", { className: "text-xl font-semibold" }, "Chat con ", React.createElement(Link, { to: `/user/${otherUser.id}`, className: "hover:underline" }, otherUser.name))
        ),
        
        exchange.status === ExchangeStatus.Accepted && (
            React.createElement(ConfirmationSection, { 
                exchange: exchange, 
                currentUser: user, 
                onConfirm: handleConfirmSwap, 
                isConfirming: isConfirming 
            })
        ),
        
        exchange.status === ExchangeStatus.Completed && React.createElement(DealCompletedInfo, { exchange: exchange, currentUser: user }),
        
        exchange.status === ExchangeStatus.Pending && isOwner && (
            React.createElement("div", { className: "text-center p-2 text-sm bg-blue-50 dark:bg-blue-900/50" }, "Revisa los artículos ofrecidos y acepta o rechaza para continuar.")
        ),
        
        React.createElement("div", { className: "flex-grow overflow-y-auto p-4 space-y-4" },
            renderNegotiationItems(),
            React.createElement("div", { className: "flex-grow border-t border-gray-300 dark:border-gray-600 my-4" }),
            chat.messages.map(renderMessage),
            React.createElement("div", { ref: messagesEndRef })
        ),
        
        [ExchangeStatus.Rejected, ExchangeStatus.Completed, ExchangeStatus.Accepted].includes(exchange.status) ? (
             React.createElement("div", { className: "p-4 text-center text-gray-500 bg-gray-100 dark:bg-gray-900" }, 
                exchange.status === 'REJECTED' ? 'Este intercambio ha sido rechazado.' : 
                exchange.status === 'COMPLETED' ? 'Este intercambio ha sido completado.' : 
                'La negociación de artículos ha finalizado. Esperando confirmación final.'
             )
        ) : (
             React.createElement("form", { onSubmit: handleSendMessage, className: "p-4 border-t dark:border-gray-700 flex items-center gap-3 bg-white dark:bg-gray-800" },
                React.createElement("input", {
                    type: "text",
                    value: newMessage,
                    onChange: (e) => setNewMessage(e.target.value),
                    placeholder: "Escribe un mensaje...",
                    className: `flex-grow px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 ${theme.focus} bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`,
                    autoComplete: "off"
                }),
                React.createElement(Button, { type: "submit", isLoading: isSending, children: "Enviar" })
            )
        )
    );
};

export default ChatDetailPage;