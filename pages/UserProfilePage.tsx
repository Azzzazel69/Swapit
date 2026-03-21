
import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../services/api.ts';
import ItemCard from '../components/ItemCard.tsx';
import SwapSpinner from '../components/SwapSpinner.tsx';
import Button from '../components/Button.tsx';
import { useAuth } from '../hooks/useAuth.tsx';
import { useToast } from '../hooks/useToast.tsx';
import BanUserModal from '../components/BanUserModal.tsx';
import ReportModal from '../components/ReportModal.tsx';

const UserRating = ({ ratings = [], stats = {} as any }) => {
    const score = stats.averageRating || 0;
    const category = stats.category || "Novato del Trueque";

    // Color based on score
    const getScoreColor = (s) => {
        if (s >= 90) return "text-emerald-500";
        if (s >= 75) return "text-blue-500";
        if (s >= 50) return "text-yellow-500";
        if (s >= 25) return "text-orange-500";
        return "text-red-500";
    };

    return (
        React.createElement("div", { className: "flex flex-col gap-4" },
            React.createElement("div", { className: "flex items-center gap-4" },
                React.createElement("div", { className: "relative inline-flex items-center justify-center" },
                    React.createElement("svg", { className: "w-16 h-16 transform -rotate-90" },
                        React.createElement("circle", { className: "text-gray-200 dark:text-gray-700", strokeWidth: "6", stroke: "currentColor", fill: "transparent", r: "26", cx: "32", cy: "32" }),
                        React.createElement("circle", { 
                            className: getScoreColor(score), 
                            strokeWidth: "6", 
                            strokeDasharray: 2 * Math.PI * 26,
                            strokeDashoffset: 2 * Math.PI * 26 * (1 - score / 100),
                            strokeLinecap: "round", 
                            stroke: "currentColor", 
                            fill: "transparent", 
                            r: "26", 
                            cx: "32", 
                            cy: "32" 
                        })
                    ),
                    React.createElement("div", { className: "absolute flex flex-col items-center" },
                        React.createElement("span", { className: `text-sm font-black ${getScoreColor(score)}` }, score)
                    )
                ),
                React.createElement("div", null,
                    React.createElement("p", { className: "text-lg font-black text-gray-800 dark:text-gray-200" }, `${score} Puntos`),
                    React.createElement("p", { className: "text-[10px] text-gray-400" }, `${ratings.length} valoraciones`)
                )
            ),
            stats.badges && stats.badges.length > 0 && React.createElement("div", { className: "flex flex-wrap gap-2" },
                stats.badges.map(badge => {
                    const isIdentity = badge === 'Perfil Verificado';
                    return React.createElement("span", { 
                        key: badge, 
                        className: `px-2 py-1 ${isIdentity ? 'bg-blue-600 text-white animate-pulse' : 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'} text-[10px] font-black uppercase rounded-md border ${isIdentity ? 'border-blue-700 shadow-lg shadow-blue-500/20' : 'border-blue-200 dark:border-blue-800'}` 
                    }, `${isIdentity ? '🛡️' : '🏅'} ${badge}`);
                })
            ),
            React.createElement("div", { className: "grid grid-cols-2 gap-2 text-center" },
                React.createElement("div", { className: "p-2 bg-gray-50 dark:bg-gray-700/50 rounded-xl" },
                    React.createElement("p", { className: "text-[10px] text-gray-400 font-bold uppercase" }, "Nivel"),
                    React.createElement("p", { className: "text-xl font-black text-blue-600" }, stats.level || 1)
                ),
                React.createElement("div", { className: "p-2 bg-gray-50 dark:bg-gray-700/50 rounded-xl" },
                    React.createElement("p", { className: "text-[10px] text-gray-400 font-bold uppercase" }, "Éxito"),
                    React.createElement("p", { className: "text-xl font-black text-green-600" }, `${stats.successRate || 100}%`)
                )
            )
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
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [showAllRatings, setShowAllRatings] = useState(false);

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

    const handleReportUser = async (reason) => {
        try {
            await api.reportContent(userId, 'USER', reason);
            showToast("Reporte enviado con éxito", "success");
        } catch (e) { showToast("Error al enviar reporte", "error"); }
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
        React.createElement(ReportModal, {
            isOpen: isReportModalOpen,
            onClose: () => setIsReportModalOpen(false),
            title: `Reportar a ${profile.name}`,
            type: "USER",
            onSubmit: handleReportUser
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
                    React.createElement("div", { className: "flex items-center gap-2" },
                        React.createElement("h1", { className: `text-4xl font-black ${isBanned ? 'text-gray-400' : 'text-gray-900 dark:text-white'}` }, profile.name),
                        profile.identityVerified && React.createElement("span", { title: "Identidad Verificada", className: "text-2xl" }, "🛡️")
                    ),
                    !isOwnProfile && currentUser && !isBanned && (
                        React.createElement("div", { className: "flex gap-2" },
                            React.createElement(Button, {
                                onClick: handleToggleFollow,
                                isLoading: isFollowingLoading,
                                variant: isFollowing ? "secondary" : "primary",
                                size: "sm",
                                className: isFollowing ? "bg-yellow-100 text-yellow-800" : "px-6",
                                children: isFollowing ? "Siguiendo" : "Seguir"
                            }),
                            React.createElement("button", {
                                onClick: () => setIsReportModalOpen(true),
                                className: "p-2 text-gray-400 hover:text-red-500 transition-colors",
                                title: "Reportar Usuario"
                            }, "🚩")
                        )
                    )
                ),
                React.createElement("p", { className: "text-gray-500 text-xs font-bold uppercase tracking-wider -mt-2" }, "Miembro desde: ", new Date(profile.createdAt || Date.now()).toLocaleDateString()),
                React.createElement(UserRating, { ratings: profile.ratings, stats: api._calculateUserStats(profile) })
            )
        ),

        profile.ratings && profile.ratings.length > 0 && React.createElement("div", { className: "mb-10" },
            React.createElement("h2", { className: "text-2xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-2" },
                React.createElement("span", { className: "p-2 bg-gray-100 dark:bg-gray-700 rounded-lg" }, "💬"),
                "Valoraciones de la Comunidad"
            ),
            React.createElement("div", { className: "space-y-4" },
                (showAllRatings ? profile.ratings : profile.ratings.slice(0, 3)).map((r, idx) => (
                    React.createElement("div", { key: idx, className: "p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700" },
                        React.createElement("div", { className: "flex justify-between items-start mb-2" },
                            React.createElement("div", { className: "flex items-center gap-2" },
                                React.createElement("span", { className: `px-2 py-0.5 rounded text-[10px] font-black text-white ${r.rating >= 90 ? 'bg-emerald-500' : r.rating >= 75 ? 'bg-blue-500' : r.rating >= 50 ? 'bg-yellow-500' : 'bg-red-500'}` }, r.rating),
                                React.createElement("span", { className: "text-[10px] font-bold text-gray-400 uppercase" }, "Puntos")
                            ),
                            React.createElement("span", { className: "text-[10px] text-gray-400" }, new Date(r.date).toLocaleDateString())
                        ),
                        React.createElement("p", { className: "text-gray-700 dark:text-gray-300 text-sm italic" }, `"${r.comment}"`)
                    )
                ))
            ),
            profile.ratings.length > 3 && React.createElement("div", { className: "mt-4 text-center" },
                React.createElement(Button, {
                    variant: "secondary",
                    size: "sm",
                    onClick: () => setShowAllRatings(!showAllRatings)
                }, showAllRatings ? "Ocultar valoraciones" : `Ver todas las valoraciones (${profile.ratings.length})`)
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
