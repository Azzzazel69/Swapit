
import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../services/api.ts';
import ItemCard from '../components/ItemCard.tsx';
import SwapSpinner from '../components/SwapSpinner.tsx';
import Button from '../components/Button.tsx';
import { useAuth } from '../hooks/useAuth.tsx';
import { useToast } from '../hooks/useToast.tsx';

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
    const { user: currentUser, refreshUser } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const location = useLocation();
    
    const [profile, setProfile] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [isFollowingLoading, setIsFollowingLoading] = useState(false);

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
                setIsFollowing(userProfile.isFollowed || false);
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
    
    const handleToggleFollow = async () => {
        if (!currentUser) {
            showToast("Inicia sesión para seguir usuarios", "error");
            return;
        }
        setIsFollowingLoading(true);
        try {
            const response = await api.toggleFollowUser(userId);
            setIsFollowing(response.isFollowing);
            // Refresh user to update 'following' list in context
            await refreshUser(); 
            showToast(response.isFollowing ? "Ahora sigues a este usuario" : "Has dejado de seguir a este usuario", "success");
        } catch (err) {
            showToast(err.message || "Error al actualizar seguimiento", "error");
        } finally {
            setIsFollowingLoading(false);
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
    
    const isOwnProfile = currentUser?.id === userId;

    return React.createElement("div", null,
        React.createElement("div", { className: "mb-6 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md flex flex-col sm:flex-row items-center gap-6" },
            React.createElement("img", { src: profile.avatarUrl, alt: "Avatar", className: "w-24 h-24 rounded-full object-cover shadow-lg" }),
            React.createElement("div", { className: "flex flex-col gap-2 flex-grow text-center sm:text-left" },
                React.createElement("div", { className: "flex flex-col sm:flex-row items-center gap-3" },
                    React.createElement("h1", { className: "text-3xl font-bold text-gray-900 dark:text-white" }, "Perfil de ", profile.name),
                    !isOwnProfile && currentUser && (
                        React.createElement(Button, {
                            onClick: handleToggleFollow,
                            isLoading: isFollowingLoading,
                            variant: isFollowing ? "secondary" : "primary",
                            size: "sm",
                            className: isFollowing ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-200" : "",
                            title: isFollowing ? "Dejar de seguir" : "Seguir usuario",
                            children: React.createElement("div", { className: "flex items-center gap-1" },
                                isFollowing ? (
                                    React.createElement(React.Fragment, null,
                                        React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-5 w-5", viewBox: "0 0 20 20", fill: "currentColor" }, React.createElement("path", { d: "M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" })),
                                        React.createElement("span", null, "Siguiendo")
                                    )
                                ) : (
                                    React.createElement(React.Fragment, null,
                                        React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-5 w-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" }, React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" })),
                                        React.createElement("span", null, "Seguir")
                                    )
                                )
                            )
                        })
                    )
                ),
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
