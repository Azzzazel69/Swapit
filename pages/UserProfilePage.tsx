
import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../services/api.ts';
import ItemCard from '../components/ItemCard.tsx';
import SwapSpinner from '../components/SwapSpinner.tsx';
import Button from '../components/Button.tsx';
import { useAuth } from '../hooks/useAuth.tsx';
import { useToast } from '../hooks/useToast.tsx';
import BanUserModal from '../components/BanUserModal.tsx';

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
    
    const [profile, setProfile] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isFollowing, setIsFollowing] = useState(false);
    const [isFollowingLoading, setIsFollowingLoading] = useState(false);
    const [isBanModalOpen, setIsBanModalOpen] = useState(false);

    const isStaff = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'MODERATOR';

    const fetchProfile = async () => {
        if (!userId) return;
        try {
            setLoading(true);
            const userProfile = await api.getUserProfile(userId);
            setProfile(userProfile);
            setItems(userProfile.items || []);
            setIsFollowing(currentUser?.following?.includes(userId) || false);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchProfile(); }, [userId, currentUser]);

    const handleToggleFavorite = async (itemId) => {
        try {
            const updatedItem = await api.toggleFavorite(itemId);
            setItems(prevItems => prevItems.map(item => item.id === itemId ? { ...item, ...updatedItem } : item));
        } catch (error) {
            showToast("No se pudo actualizar favoritos.", "error");
        }
    };
    
    const handleToggleFollow = async () => {
        if (!currentUser) return;
        setIsFollowingLoading(true);
        try {
            const response = await api.toggleFollowUser(userId);
            setIsFollowing(response.isFollowing);
            await refreshUser(); 
            showToast(response.isFollowing ? "Ahora sigues a este usuario" : "Has dejado de seguir a este usuario", "success");
        } finally {
            setIsFollowingLoading(false);
        }
    };

    const handleBan = async (reason, details) => {
        try {
            await api.banUser(userId, `${reason}: ${details}`);
            showToast("Usuario suspendido", "success");
            fetchProfile();
        } catch (e) { showToast(e.message, "error"); }
    };

    const handleUnban = async () => {
        try {
            await api.unbanUser(userId);
            showToast("Usuario reactivado", "success");
            fetchProfile();
        } catch (e) { showToast(e.message, "error"); }
    };

    const handleAdminChat = async () => {
        try {
            const chatId = await api.openDirectAdminChat(userId);
            navigate(`/chat/${chatId}`);
        } catch (e) { showToast(e.message, "error"); }
    };

    if (loading) return React.createElement(SwapSpinner, { size: "lg" });
    if (error) return React.createElement("p", { className: "text-red-500 p-10 text-center" }, "Error: ", error);
    if (!profile) return React.createElement("p", { className: "p-10 text-center" }, "Perfil no encontrado.");
    
    const isOwnProfile = currentUser?.id === userId;
    const isBanned = profile.isBanned;

    return React.createElement("div", { className: "max-w-4xl mx-auto" },
        React.createElement(BanUserModal, { 
            isOpen: isBanModalOpen, 
            onClose: () => setIsBanModalOpen(false), 
            onConfirm: handleBan, 
            userName: profile.name 
        }),
        
        isBanned && (
            React.createElement("div", { className: "bg-red-100 dark:bg-red-900/30 border-l-8 border-red-600 text-red-700 dark:text-red-300 p-6 mb-8 rounded-xl animate-shake" },
                React.createElement("h3", { className: "font-black text-xl mb-1 uppercase" }, "Cuenta Suspendida"),
                React.createElement("p", null, "Este usuario está baneado por: ", React.createElement("span", { className: "font-bold italic" }, profile.banReason)),
                isStaff && React.createElement(Button, { size: "sm", variant: "secondary", className: "mt-4", onClick: handleUnban }, "Reactivar Cuenta Ahora")
            )
        ),

        React.createElement("div", { className: "mb-10 p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl flex flex-col md:flex-row items-center gap-8 relative overflow-hidden" },
            isStaff && React.createElement("div", { className: "absolute top-4 right-4 flex gap-2" },
                React.createElement("button", { 
                    onClick: handleAdminChat,
                    className: "p-2 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors",
                    title: "Chat Directo Moderación"
                }, "💬 STAFF"),
                !isBanned && React.createElement("button", { 
                    onClick: () => setIsBanModalOpen(true),
                    className: "p-2 bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors",
                    title: "Suspender Usuario"
                }, "🚫 BAN")
            ),

            React.createElement("img", { src: profile.avatarUrl, alt: "Avatar", className: `w-32 h-32 rounded-full object-cover shadow-2xl border-4 border-white dark:border-gray-700 ${isBanned ? 'grayscale opacity-50' : ''}` }),
            
            React.createElement("div", { className: "flex flex-col gap-3 flex-grow text-center md:text-left" },
                React.createElement("div", { className: "flex flex-col md:flex-row items-center gap-4" },
                    React.createElement("h1", { className: `text-4xl font-black ${isBanned ? 'text-gray-400' : 'text-gray-900 dark:text-white'}` }, profile.name),
                    !isOwnProfile && currentUser && !isBanned && (
                        React.createElement(Button, {
                            onClick: handleToggleFollow,
                            isLoading: isFollowingLoading,
                            variant: isFollowing ? "secondary" : "primary",
                            size: "sm",
                            className: isFollowing ? "bg-yellow-100 text-yellow-800" : "px-6",
                            children: isFollowing ? "Siguiendo" : "Seguir"
                        })
                    )
                ),
                React.createElement(UserRating, { ratings: profile.ratings }),
                React.createElement("p", { className: "text-gray-500 text-sm" }, "Miembro desde: ", new Date(profile.createdAt || Date.now()).toLocaleDateString())
            )
        ),
        
        (!isBanned || isStaff) && React.createElement(React.Fragment, null, 
            React.createElement("h2", { className: "text-2xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-2" }, 
                React.createElement("span", { className: "p-2 bg-gray-100 dark:bg-gray-700 rounded-lg" }, "📦"),
                "Artículos de ", profile.name
            ),
            items.length === 0 ? (
                React.createElement("div", { className: "text-center py-20 bg-gray-50 dark:bg-gray-800/30 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700" },
                  React.createElement("p", { className: "text-gray-500" }, "No hay artículos disponibles.")
                )
            ) : (
                React.createElement("div", { className: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6" },
                  items.map((item) => (
                      React.createElement(ItemCard, { 
                          key: item.id, 
                          item: item, 
                          onToggleFavorite: handleToggleFavorite,
                          onDelete: isStaff ? (id) => api.deleteItem(id).then(fetchProfile) : undefined
                      })
                  ))
                )
            )
        )
    );
};

export default UserProfilePage;
