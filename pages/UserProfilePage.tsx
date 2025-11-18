
import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../services/api.ts';
import ItemCard from '../components/ItemCard.tsx';
import SwapSpinner from '../components/SwapSpinner.tsx';
import Button from '../components/Button.tsx';
import { useAuth } from '../hooks/useAuth.tsx';

const UserRating = ({ ratings = [] }) => {
    const averageRating = useMemo(() => {
        if (!ratings || ratings.length === 0) return 0;
        const total = ratings.reduce((acc, r) => acc + r.rating, 0);
        return total / ratings.length;
    }, [ratings]);

    if (ratings.length === 0) {
        return React.createElement("p", { className: "text-sm text-gray-500 dark:text-gray-400" }, "Aún no tiene valoraciones");
    }

    return (
        React.createElement("div", { className: "flex items-center gap-2" },
            React.createElement("div", { className: "flex items-center" },
                [...Array(5)].map((_, i) => (
                    React.createElement("svg", { key: i, className: `w-5 h-5 ${averageRating > i ? "text-yellow-400" : "text-gray-300 dark:text-gray-600"}`, fill: "currentColor", viewBox: "0 0 20 20" },
                        React.createElement("path", { d: "M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" })
                    )
                ))
            ),
            React.createElement("span", { className: "font-bold text-gray-700 dark:text-gray-300" }, averageRating.toFixed(1)),
            React.createElement("span", { className: "text-sm text-gray-500 dark:text-gray-400" }, `(${ratings.length} valoraciones)`)
        )
    );
};

const UserProfilePage = () => {
    const { userId } = useParams();
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    
    const [profile, setProfile] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const queryParams = new URLSearchParams(location.search);
    const fromExchangeId = queryParams.get('fromExchange');
    
    useEffect(() => {
        const fetchProfile = async () => {
            if (!userId) return;
            try {
                setLoading(true);
                const userProfile = await api.getUserProfile(userId);
                setProfile(userProfile);
                setItems(userProfile.items || []);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [userId]);

    const handleCounterOffer = async (itemId) => {
        if (!fromExchangeId) return;
        setIsSubmitting(true);
        try {
            await api.addCounterOffer(fromExchangeId, [itemId]);
            navigate(`/chat/${fromExchangeId}`);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleToggleFavorite = async (itemId) => {
        try {
            const updatedItem = await api.toggleFavorite(itemId);
            setItems(prevItems => prevItems.map(item => item.id === itemId ? { ...item, ...updatedItem } : item));
        } catch (error) {
            console.error("Error toggling favorite", error);
            setError("No se pudo actualizar el estado de favorito.");
        }
    };
    
    if (loading) {
        return React.createElement(SwapSpinner, null);
    }

    if (error) {
        return React.createElement("p", { className: "text-red-500" }, "Error: ", error);
    }
    
    if (!profile) {
        return React.createElement("p", null, "Perfil no encontrado.");
    }
    
    return React.createElement("div", null,
        React.createElement("div", { className: "mb-6 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md flex items-center gap-6" },
            React.createElement("img", { src: profile.avatarUrl, alt: "Avatar", className: "w-24 h-24 rounded-full object-cover shadow-lg" }),
            React.createElement("div", { className: "flex flex-col gap-2" },
                React.createElement("h1", { className: "text-3xl font-bold text-gray-900 dark:text-white" }, "Perfil de ", profile.name),
                React.createElement(UserRating, { ratings: profile.ratings })
            )
        ),
        
        React.createElement("h2", { className: "text-2xl font-bold text-gray-900 dark:text-white mb-4" }, "Artículos disponibles de ", profile.name),

        items.length === 0 ? (
          React.createElement("p", { className: "text-center text-gray-500 dark:text-gray-400 mt-10" },
            `${profile.name} no tiene artículos disponibles en este momento.`
          )
        ) : (
          React.createElement("div", { className: "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" },
            items.map((item) => (
                React.createElement("div", { key: item.id, className: "relative" },
                    // Fix: Pass missing 'onDelete' and 'deletingItemId' props to ItemCard
                    React.createElement(ItemCard, { item: item, onToggleFavorite: handleToggleFavorite, onDelete: undefined, deletingItemId: undefined }),
                    fromExchangeId && item.userId !== currentUser.id && (
                        React.createElement(Button, {
                            onClick: () => handleCounterOffer(item.id),
                            isLoading: isSubmitting,
                            className: "w-full mt-2",
                            size: "sm",
                            children: "Contraoferta"
                        })
                    )
                )
            ))
          )
        )
    );
};

export default UserProfilePage;
