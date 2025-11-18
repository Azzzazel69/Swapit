
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api.ts';
import { useAuth } from '../hooks/useAuth.tsx';
import SwapSpinner from '../components/SwapSpinner.tsx';
import Button from '../components/Button.tsx';
import { useToast } from '../hooks/useToast.tsx';

const Star = ({ filled, onClick }) => (
    React.createElement("button", { onClick: onClick, className: "text-2xl md:text-3xl transition-transform transform hover:scale-125 focus:outline-none" },
        React.createElement("svg", { className: `w-6 h-6 md:w-8 md:h-8 ${filled ? "text-yellow-400" : "text-gray-300 dark:text-gray-600"}`, fill: "currentColor", viewBox: "0 0 20 20" },
            React.createElement("path", { d: "M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" })
        )
    )
);

const RateExchangePage = () => {
    const { exchangeId } = useParams();
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();
    const { showToast } = useToast();

    const [exchange, setExchange] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchExchange = async () => {
            try {
                const { exchange: fetchedExchange } = await api.getChatAndExchangeDetails(exchangeId);
                setExchange(fetchedExchange);
            } catch (err) {
                setError("No se pudo cargar la información del intercambio.");
            } finally {
                setLoading(false);
            }
        };
        fetchExchange();
    }, [exchangeId]);

    const handleSubmit = async () => {
        if (rating === 0) {
            setError("Por favor, selecciona una puntuación.");
            return;
        }
        setError('');
        setIsSubmitting(true);
        try {
            await (api as any).rateUserAndCompleteExchange(exchangeId, { rating, comment });
            showToast("¡Gracias por tu valoración!", 'success');
            navigate('/exchanges');
        } catch (err) {
            setError(err.message || "Ocurrió un error al enviar la valoración.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return React.createElement(SwapSpinner, null);
    }
    
    if (error && !exchange) {
        return React.createElement("div", { className: "text-center text-red-500" }, error);
    }
    
    if (!exchange) {
        return React.createElement("div", { className: "text-center" }, "Intercambio no encontrado.");
    }
    
    const otherUser = currentUser.id === exchange.owner.id ? exchange.requester : exchange.owner;
    
    const ratingLabels = [
        "Muy Mal", "Mal", "Regular", "Normal", "Bien",
        "Bastante Bien", "Muy Bien", "Genial", "Excelente", "¡Perfecto!"
    ];

    // Fix: Extract props for textarea to fix TS error
    const textareaProps = {
        id: "rating-comment",
        rows: 3,
        value: comment,
        onChange: (e) => setComment(e.target.value),
        placeholder: "Ej: El usuario fue muy amable y el artículo estaba en perfectas condiciones...",
        className: "appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
    };

    return (
        React.createElement("div", { className: "max-w-xl mx-auto py-8" },
            React.createElement("div", { className: "bg-white dark:bg-gray-800 p-6 md:p-8 rounded-xl shadow-lg text-center" },
                React.createElement("h1", { className: "text-2xl font-bold mb-2" }, "Valora tu intercambio con"),
                React.createElement("div", { className: "flex items-center justify-center gap-4 my-4" },
                    React.createElement("img", { src: otherUser.avatarUrl, alt: otherUser.name, className: "w-16 h-16 rounded-full object-cover" }),
                    React.createElement("span", { className: "text-2xl font-bold" }, otherUser.name)
                ),
                React.createElement("p", { className: "text-gray-600 dark:text-gray-400 mb-6" }, "¿Cómo ha sido tu experiencia? Tu opinión ayuda a construir una comunidad segura."),

                React.createElement("div", { className: "flex justify-center items-center flex-nowrap gap-1 md:gap-2 my-6" },
                    [...Array(10)].map((_, i) => {
                        const ratingValue = i + 1;
                        return React.createElement(Star, { 
                            key: ratingValue, 
                            filled: ratingValue <= rating, 
                            onClick: () => setRating(ratingValue) 
                        });
                    })
                ),
                
                React.createElement("div", { className: "h-6 mb-6" },
                    rating > 0 && React.createElement("p", { className: "text-lg font-semibold text-gray-700 dark:text-gray-200" }, `${rating} - ${ratingLabels[rating-1]}`)
                ),
                
                React.createElement("div", { className: "mb-6 text-left" },
                    React.createElement("label", { htmlFor: "rating-comment", className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" }, "Añadir un comentario (opcional)"),
                    React.createElement("textarea", textareaProps)
                ),

                error && React.createElement("p", { className: "text-red-500 text-sm mb-4" }, error),
                
                React.createElement(Button, {
                    onClick: handleSubmit,
                    isLoading: isSubmitting,
                    disabled: rating === 0,
                    size: "lg",
                    className: "w-full",
                    children: "Enviar Valoración y Finalizar"
                }),

                React.createElement(Button, {
                    onClick: () => navigate(`/chat/${exchangeId}`),
                    variant: "secondary",
                    className: "w-full mt-4",
                    children: "Volver al chat"
                })
            )
        )
    );
};

export default RateExchangePage;
