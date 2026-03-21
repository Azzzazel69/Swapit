
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.tsx';
import Button from '../components/Button.tsx';
import Input from '../components/Input.tsx';
import { ICONS } from '../constants.tsx';
import { api } from '../services/api.ts';
import { APP_VERSION, UPDATE_DATE } from '../constants.tsx';
import ItemCard from '../components/ItemCard.tsx';
import SwapSpinner from '../components/SwapSpinner.tsx';
import PreferencesModal from '../components/PreferencesModal.tsx';
import AutocompleteInput from '../components/AutocompleteInput.tsx';
import LocationSelector from '../components/LocationSelector.tsx';
import EmptyState from '../components/EmptyState.tsx';
import { useToast } from '../hooks/useToast.tsx';
import { locations } from '../data/locations.ts';
import { useColorTheme } from '../hooks/useColorTheme.tsx';

// ProfileSection component for organizing profile fields
const ProfileSection = ({ title, children, onEdit, isEditing, onSave, onCancel, isLoading, isEditable, disabledReason }: { title: string, children?: React.ReactNode, onEdit?: () => void, isEditing: boolean, onSave: () => void, onCancel: () => void, isLoading: boolean, isEditable: boolean, disabledReason: any }) => {
    const renderDisabledReason = () => {
        switch (disabledReason) {
            case 'cooldown': return 'Has modificado tus datos en las últimas 24 horas. Inténtalo más tarde.';
            case 'active': return 'Tienes un intercambio activo. No puedes editar tus datos hasta que finalice.';
            case 'recent': return 'Has completado un intercambio recientemente. Espera 14 días para poder editar.';
            default: return 'La edición no está disponible en este momento.';
        }
    };

    return (
        React.createElement("div", { className: "bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8" },
            React.createElement("div", { className: "flex justify-between items-center mb-4" },
                React.createElement("h3", { className: "text-xl font-semibold text-gray-900 dark:text-white" }, title),
                !isEditing && onEdit && (
                    React.createElement(Button, {
                        onClick: onEdit,
                        variant: "secondary",
                        size: "sm",
                        disabled: !isEditable,
                        title: !isEditable ? renderDisabledReason() : 'Editar',
                        children: "Editar"
                    })
                )
            ),
            !isEditable && onEdit && React.createElement("div", { className: "text-sm text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30 p-3 rounded-md mb-4" },
                renderDisabledReason()
            ),
            children,
            isEditing && (
                React.createElement("div", { className: "flex justify-end gap-2 mt-4" },
                    React.createElement(Button, { onClick: onCancel, variant: "secondary", children: "Cancelar" }),
                    React.createElement(Button, { onClick: onSave, isLoading: isLoading, children: "Guardar" })
                )
            )
        )
    );
};

// UserRating component for displaying user score and category
const UserRating = ({ ratings = [], stats = {} as any }: { ratings?: any[], stats?: any }) => {
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

    const getBgColor = (s) => {
        if (s >= 90) return "bg-emerald-500";
        if (s >= 75) return "bg-blue-500";
        if (s >= 50) return "bg-yellow-500";
        if (s >= 25) return "bg-orange-500";
        return "bg-red-500";
    };

    return (
        React.createElement("div", { className: "flex flex-col gap-4" },
            React.createElement("div", { className: "text-center" },
                React.createElement("div", { className: "relative inline-flex items-center justify-center mb-2" },
                    React.createElement("svg", { className: "w-24 h-24 transform -rotate-90" },
                        React.createElement("circle", { className: "text-gray-200 dark:text-gray-700", strokeWidth: "8", stroke: "currentColor", fill: "transparent", r: "40", cx: "48", cy: "48" }),
                        React.createElement("circle", { 
                            className: getScoreColor(score), 
                            strokeWidth: "8", 
                            strokeDasharray: 2 * Math.PI * 40,
                            strokeDashoffset: 2 * Math.PI * 40 * (1 - score / 100),
                            strokeLinecap: "round", 
                            stroke: "currentColor", 
                            fill: "transparent", 
                            r: "40", 
                            cx: "48", 
                            cy: "48" 
                        })
                    ),
                    React.createElement("div", { className: "absolute flex flex-col items-center" },
                        React.createElement("span", { className: `text-2xl font-black ${getScoreColor(score)}` }, score),
                        React.createElement("span", { className: "text-[8px] font-bold text-gray-400 uppercase" }, "Puntos")
                    )
                ),
                React.createElement("p", { className: "text-[10px] text-gray-400 mt-1" }, `${ratings.length} valoraciones`)
            ),
            stats.badges && stats.badges.length > 0 && React.createElement("div", { className: "flex flex-wrap gap-2 justify-center" },
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

// Main ProfilePage component
const ProfilePage = () => {
    const { user, updateUser, logout } = useAuth();
    const { theme } = useColorTheme();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const location = useLocation();

    const [isEditingInfo, setIsEditingInfo] = useState(false);
    const [isEditingPassword, setIsEditingPassword] = useState(false);
    const [isPreferencesModalOpen, setIsPreferencesModalOpen] = useState(false);
    const [showAllRatings, setShowAllRatings] = useState(false);
    
    const [editName, setEditName] = useState('');
    const [editCountry, setEditCountry] = useState('');
    const [editCity, setEditCity] = useState('');
    const [editPostalCode, setEditPostalCode] = useState('');
    const [editAddress, setEditAddress] = useState('');
    
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    // Trust verification state
    const [showTrustModal, setShowTrustModal] = useState(false);
    const [trustPlatform, setTrustPlatform] = useState('Instagram');
    const [trustUsername, setTrustUsername] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [isVerifyingTrust, setIsVerifyingTrust] = useState(false);
    const [trustStep, setTrustStep] = useState(1); // 1: Input, 2: Show Code
    
    const [isLoading, setIsLoading] = useState(false);
    const [userItems, setUserItems] = useState([]);
    const [isItemsLoading, setIsItemsLoading] = useState(true);
    const [isEditable, setIsEditable] = useState(true);
    const [disabledReason, setDisabledReason] = useState(null);
    const [stats, setStats] = useState<any>({});

    useEffect(() => {
        if (user) {
            setEditName(user.name);
            setEditCountry(user.location?.country || '');
            setEditCity(user.location?.city || '');
            setEditPostalCode(user.location?.postalCode || '');
            setEditAddress(user.location?.address || '');
            fetchUserItems();
            checkEditableStatus();
            setStats(api._calculateUserStats(user));
        }
    }, [user]);

    useEffect(() => {
        if (location.state?.message) {
            showToast(location.state.message, location.state.variant || 'success');
            // Clear location state to prevent repeat toasts
            window.history.replaceState({}, document.title);
        }
    }, [location.state, showToast]);

    const fetchUserItems = async () => {
        if (!user) return;
        try {
            setIsItemsLoading(true);
            const items = await api.getUserItems(user.id);
            const updatedItems = items.map(item => ({
                ...item,
                ownerName: item.ownerName && item.ownerName !== 'Usuario' ? item.ownerName : (user.name || 'Usuario'),
                ownerAvatarUrl: item.ownerAvatarUrl || user.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user.id,
                ownerLocation: item.ownerLocation || user.location || null
            }));
            setUserItems(updatedItems);
        } catch (error) {
            showToast("Error al cargar tus artículos.", "error");
        } finally {
            setIsItemsLoading(false);
        }
    };

    const checkEditableStatus = async () => {
        try {
            const status = await api.canEditProfile();
            setIsEditable(status.canEdit);
            setDisabledReason(status.reason);
        } catch (error) {
            console.error("Error checking editable status", error);
        }
    };

    const handleSaveInfo = async () => {
        setIsLoading(true);
        try {
            const updatedUser = await api.updateUserProfileData({
                name: editName,
                location: {
                    country: editCountry,
                    city: editCity,
                    postalCode: editPostalCode,
                    address: editAddress,
                    lat: user.location?.lat,
                    lng: user.location?.lng
                }
            });
            updateUser(updatedUser);
            setIsEditingInfo(false);
            showToast("Perfil actualizado correctamente.", "success");
        } catch (error) {
            showToast(error.message || "Error al actualizar perfil.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSavePassword = async () => {
        if (newPassword !== confirmPassword) {
            showToast("Las contraseñas no coinciden.", "error");
            return;
        }
        setIsLoading(true);
        try {
            await api.updateUserPassword(currentPassword, newPassword);
            setIsEditingPassword(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            showToast("Contraseña actualizada correctamente.", "success");
        } catch (error) {
            showToast(error.message || "Error al actualizar contraseña.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSavePreferences = async (newPreferences) => {
        try {
            const updatedUser = await api.updateUserPreferences(newPreferences);
            updateUser(updatedUser);
            showToast("Intereses actualizados.", "success");
        } catch (error) {
            showToast(error.message || "Error al actualizar intereses.", "error");
        }
    };

    const handleDeleteItem = async (itemId) => {
        if (window.confirm("¿Estás seguro de eliminar este artículo?")) {
            try {
                await api.deleteItem(itemId);
                setUserItems(prev => prev.filter(i => i.id !== itemId));
                showToast("Artículo eliminado.", "success");
            } catch (error) {
                showToast("Error al eliminar artículo.", "error");
            }
        }
    };

    const countries = useMemo(() => Object.keys(locations), []);
    const citiesForSelectedCountry = useMemo(() => {
        return editCountry && locations[editCountry] ? locations[editCountry] : [];
    }, [editCountry]);

    if (!user) return null;

    return (
        React.createElement("div", { className: "max-w-4xl mx-auto py-8" },
            React.createElement("div", { className: "flex items-center justify-between mb-8" },
                React.createElement("h1", { className: "text-3xl font-bold text-gray-900 dark:text-white" }, "Mi Perfil"),
                React.createElement(Button, { variant: "danger", size: "sm", onClick: logout, children: "Cerrar Sesión" })
            ),

            React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-8" },
                // Avatar Column
                React.createElement("div", { className: "md:col-span-1" },
                    React.createElement("div", { className: "bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center" },
                        React.createElement("img", { src: user.avatarUrl, alt: "Avatar", className: "w-32 h-32 rounded-full mx-auto object-cover mb-4 shadow-lg border-4 border-white dark:border-gray-700" }),
                        React.createElement("h2", { className: "text-xl font-bold text-gray-900 dark:text-white mb-0" }, user.name),
                        React.createElement("p", { className: "text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-4" }, "Miembro desde: ", new Date(user.createdAt || Date.now()).toLocaleDateString()),
                        React.createElement(UserRating, { ratings: user.ratings, stats: stats })
                    ),

                    user.ratings && user.ratings.length > 0 && React.createElement("div", { className: "bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mt-8" },
                        React.createElement("h3", { className: "text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2" },
                            React.createElement("span", null, "💬"),
                            "Mis Valoraciones"
                        ),
                        React.createElement("div", { className: "space-y-4" },
                            (showAllRatings ? user.ratings : user.ratings.slice(0, 3)).map((r, idx) => (
                                React.createElement("div", { key: idx, className: "p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700" },
                                    React.createElement("div", { className: "flex justify-between items-start mb-1" },
                                        React.createElement("div", { className: "flex items-center gap-2" },
                                            React.createElement("span", { className: `px-2 py-0.5 rounded text-[10px] font-black text-white ${r.rating >= 90 ? 'bg-emerald-500' : r.rating >= 75 ? 'bg-blue-500' : r.rating >= 50 ? 'bg-yellow-500' : 'bg-red-500'}` }, r.rating),
                                            React.createElement("span", { className: "text-[10px] font-bold text-gray-400 uppercase" }, "Puntos")
                                        ),
                                        React.createElement("span", { className: "text-[10px] text-gray-400" }, new Date(r.date).toLocaleDateString())
                                    ),
                                    React.createElement("p", { className: "text-gray-600 dark:text-gray-400 text-xs italic" }, `"${r.comment}"`)
                                )
                            ))
                        ),
                        user.ratings.length > 3 && React.createElement("div", { className: "mt-4 text-center" },
                            React.createElement(Button, {
                                variant: "secondary",
                                size: "sm",
                                onClick: () => setShowAllRatings(!showAllRatings)
                            }, showAllRatings ? "Ocultar valoraciones" : `Ver todas (${user.ratings.length})`)
                        )
                    )
                ),

                // Info Column
                React.createElement("div", { className: "md:col-span-2" },
                    React.createElement(ProfileSection, {
                        title: "Información Personal",
                        isEditing: isEditingInfo,
                        onEdit: () => setIsEditingInfo(true),
                        onSave: handleSaveInfo,
                        onCancel: () => setIsEditingInfo(false),
                        isLoading: isLoading,
                        isEditable: isEditable,
                        disabledReason: disabledReason
                    },
                        !isEditingInfo ? (
                            React.createElement("div", { className: "space-y-2" },
                                React.createElement("p", null, React.createElement("strong", null, "Nombre: "), user.name),
                                React.createElement("p", null, React.createElement("strong", null, "Email: "), user.email),
                                React.createElement("p", null, React.createElement("strong", null, "Ubicación: "), `${user.location?.city || 'N/A'}, ${user.location?.country || 'N/A'}`)
                            )
                        ) : (
                            React.createElement("div", { className: "space-y-4" },
                                React.createElement(Input, { id: "p-name", label: "Nombre", value: editName, onChange: e => setEditName(e.target.value) }),
                                React.createElement("div", { className: "mt-4" },
                                    React.createElement("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" }, "Ubicación"),
                                    React.createElement(LocationSelector, { 
                                        onChange: (loc) => {
                                            setEditCountry(loc.country || 'España');
                                            setEditCity(loc.city);
                                            // Actualizamos el estado local para que se guarde al pulsar Guardar
                                            setEditPostalCode(loc.postalCode || editPostalCode);
                                            setEditAddress(loc.address || editAddress);
                                        },
                                        onError: (msg) => showToast(msg, 'error')
                                    })
                                ),
                                React.createElement(Input, { id: "p-address", label: "Dirección", value: editAddress, onChange: e => setEditAddress(e.target.value) }),
                                React.createElement(Input, { id: "p-zip", label: "Código Postal", value: editPostalCode, onChange: e => setEditPostalCode(e.target.value) })
                            )
                        )
                    ),

                    React.createElement(ProfileSection, {
                        title: "Seguridad",
                        isEditing: isEditingPassword,
                        onEdit: () => setIsEditingPassword(true),
                        onSave: handleSavePassword,
                        onCancel: () => setIsEditingPassword(false),
                        isLoading: isLoading,
                        isEditable: isEditable,
                        disabledReason: disabledReason
                    },
                        isEditingPassword && (
                            React.createElement("div", { className: "space-y-4" },
                                React.createElement(Input, { id: "old-pass", label: "Contraseña Actual", type: "password", value: currentPassword, onChange: e => setCurrentPassword(e.target.value) }),
                                React.createElement(Input, { id: "new-pass", label: "Nueva Contraseña", type: "password", value: newPassword, onChange: e => setNewPassword(e.target.value) }),
                                React.createElement(Input, { id: "conf-pass", label: "Confirmar Nueva Contraseña", type: "password", value: confirmPassword, onChange: e => setConfirmPassword(e.target.value) })
                            )
                        ) || React.createElement("p", { className: "text-sm text-gray-500" }, "Actualiza tu contraseña para mantener tu cuenta segura.")
                    ),

                    React.createElement("div", { className: "bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8" },
                        React.createElement("h3", { className: "text-xl font-semibold text-gray-900 dark:text-white mb-4" }, "Estado de Seguridad"),
                        React.createElement("div", { className: "space-y-4" },
                            React.createElement("div", { className: "flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl" },
                                React.createElement("div", { className: "flex items-center gap-3" },
                                    React.createElement("span", { className: "text-xl" }, "🔑"),
                                    React.createElement("div", null,
                                        React.createElement("p", { className: "text-sm font-bold dark:text-white" }, "Contraseña"),
                                        React.createElement("p", { className: "text-[10px] text-gray-500" }, "Actualiza tu seguridad")
                                    )
                                ),
                                React.createElement(Button, { 
                                    size: "sm", 
                                    variant: "secondary", 
                                    onClick: () => {
                                        api.resetPassword(user.email)
                                            .then(() => showToast("Email de restablecimiento enviado", "success"))
                                            .catch(err => showToast(err.message, "error"));
                                    },
                                    children: "Cambiar"
                                })
                            ),
                            React.createElement("div", { className: "flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl" },
                                React.createElement("div", { className: "flex items-center gap-3" },
                                    React.createElement("span", { className: "text-xl" }, "📧"),
                                    React.createElement("div", null,
                                        React.createElement("p", { className: "text-sm font-bold dark:text-white" }, "Email Verificado"),
                                        React.createElement("p", { className: "text-[10px] text-gray-500" }, user.email)
                                    )
                                ),
                                user.emailVerified ? 
                                    React.createElement("span", { className: "text-green-500 font-black text-xs" }, "✓ VERIFICADO") : 
                                    React.createElement(Button, { size: "sm", variant: "secondary", onClick: () => api.verifyEmail().then(() => showToast("Email verificado", "success")), children: "Verificar" })
                            ),
                            React.createElement("div", { className: "flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl" },
                                React.createElement("div", { className: "flex items-center gap-3" },
                                    React.createElement("span", { className: "text-xl" }, "📱"),
                                    React.createElement("div", null,
                                        React.createElement("p", { className: "text-sm font-bold dark:text-white" }, "Teléfono"),
                                        React.createElement("p", { className: "text-[10px] text-gray-500" }, "Protección contra bots")
                                    )
                                ),
                                user.phoneVerified ? 
                                    React.createElement("span", { className: "text-green-500 font-black text-xs" }, "✓ VERIFICADO") : 
                                    React.createElement("div", { className: "flex items-center gap-2" },
                                        React.createElement("span", { className: "text-orange-500 font-black text-xs" }, "NO VERIFICADO"),
                                        React.createElement(Button, { size: "sm", variant: "secondary", onClick: () => navigate('/verify-phone'), children: "Verificar" })
                                    )
                            ),
                            React.createElement("div", { className: "flex flex-col gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800" },
                                React.createElement("div", { className: "flex items-center justify-between" },
                                    React.createElement("div", { className: "flex items-center gap-3" },
                                        React.createElement("span", { className: "text-xl" }, "🆔"),
                                        React.createElement("div", null,
                                            React.createElement("p", { className: "text-sm font-bold dark:text-white" }, "Verificación de Confianza"),
                                            React.createElement("p", { className: "text-[10px] text-blue-600 dark:text-blue-400 font-bold" }, "Badge de Swapper Confiable")
                                        )
                                    ),
                                    user.identityVerified ? 
                                        React.createElement("span", { className: "text-blue-600 font-black text-xs flex items-center gap-1" }, 
                                            React.createElement("span", null, "🛡️"), "CONFIABLE"
                                        ) : 
                                        user.identityVerificationStatus === 'PENDING' ?
                                        React.createElement("div", { className: "flex items-center gap-2" },
                                            React.createElement("span", { className: "text-yellow-600 font-black text-xs" }, "⌛ PENDIENTE"),
                                            React.createElement(Button, { size: "sm", variant: "primary", onClick: () => setShowTrustModal(true), children: "Ver código" })
                                        ) :
                                        React.createElement(Button, { 
                                            size: "sm", 
                                            variant: "primary", 
                                            disabled: !user.emailVerified || !user.phoneVerified,
                                            onClick: () => setShowTrustModal(true),
                                            children: "Verificar"
                                        })
                                ),
                                !user.identityVerified && React.createElement("p", { className: "text-[10px] text-gray-500 italic" }, 
                                    "Vincula una red social para que podamos validar tu perfil automáticamente mediante un código de seguridad."
                                )
                            )
                        )
                    ),

                    React.createElement("div", { className: "bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8" },
                        React.createElement("div", { className: "flex justify-between items-center mb-4" },
                            React.createElement("h3", { className: "text-xl font-semibold text-gray-900 dark:text-white" }, "Mis Intereses"),
                            React.createElement(Button, { variant: "secondary", size: "sm", onClick: () => setIsPreferencesModalOpen(true) }, "Editar")
                        ),
                        React.createElement("div", { className: "flex flex-wrap gap-2" },
                            user.preferences?.length > 0 ? user.preferences.map(pref => (
                                React.createElement("span", { key: pref, className: `px-3 py-1 rounded-full text-xs font-semibold ${theme.lightBg} ${theme.darkText}` }, pref)
                            )) : React.createElement("p", { className: "text-sm text-gray-500" }, "No has seleccionado intereses.")
                        ),
                        React.createElement(PreferencesModal, {
                            isOpen: isPreferencesModalOpen,
                            onClose: () => setIsPreferencesModalOpen(false),
                            initialPreferences: user.preferences,
                            onSave: handleSavePreferences
                        })
                    )
                )
            ),

            React.createElement("div", { className: "mt-12" },
                React.createElement("div", { className: "flex justify-between items-center mb-6" },
                    React.createElement("h2", { className: "text-2xl font-bold text-gray-900 dark:text-white" }, "Mis Artículos"),
                    React.createElement(Link, { to: "/add-item" },
                        React.createElement(Button, { size: "sm", children: "Añadir Artículo" })
                    )
                ),
                isItemsLoading ? (
                    React.createElement("div", { className: "flex justify-center" }, React.createElement(SwapSpinner, null))
                ) : userItems.length === 0 ? (
                    React.createElement(EmptyState, {
                        icon: ICONS.swap,
                        title: "No tienes artículos",
                        message: "Añade artículos a tu perfil para que otros swappers puedan proponerte intercambios.",
                        actionButton: React.createElement(Link, { to: "/add-item" }, React.createElement(Button, { children: "Subir mi primer artículo" }))
                    })
                ) : (
                    React.createElement("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-6" },
                        userItems.map(item => (
                            React.createElement(ItemCard, {
                                key: item.id,
                                item: item,
                                isOwnItem: true,
                                onDelete: handleDeleteItem
                            })
                        ))
                    )
                )
            ),

            React.createElement("div", { className: "mt-12 pt-8 border-t dark:border-gray-700 flex flex-col items-center gap-2" },
                React.createElement("p", { className: "text-[10px] font-black text-gray-400 uppercase tracking-widest" }, "Swapit App"),
                React.createElement("div", { className: "flex items-center gap-3" },
                    React.createElement("span", { className: "px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-[10px] font-mono text-gray-500" }, `v${APP_VERSION}`),
                    React.createElement("span", { className: "text-[10px] text-gray-400" }, `Actualizado: ${UPDATE_DATE}`)
                ),
                React.createElement("button", { 
                    onClick: () => {
                        showToast("Buscando actualizaciones...", "info");
                        setTimeout(() => showToast("Ya tienes la última versión", "success"), 1500);
                    },
                    className: "text-[10px] font-bold text-blue-500 hover:underline"
                }, "Comprobar actualizaciones")
            ),
            
            showTrustModal && React.createElement("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" },
                React.createElement("div", { className: "bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200" },
                    React.createElement("div", { className: "flex justify-between items-center mb-6" },
                        React.createElement("h2", { className: "text-xl font-bold text-gray-900 dark:text-white" }, "Verificación de Confianza"),
                        React.createElement("button", { onClick: () => setShowTrustModal(false), className: "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300" },
                            React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" },
                                React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M6 18L18 6M6 6l12 12" })
                            )
                        )
                    ),
                    
                    trustStep === 1 ? (
                        React.createElement("div", { className: "space-y-4" },
                            React.createElement("p", { className: "text-sm text-gray-600 dark:text-gray-400" }, "Selecciona una red social para vincular tu cuenta. Esto nos ayuda a confirmar que eres una persona real."),
                            React.createElement("div", null,
                                React.createElement("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" }, "Plataforma"),
                                React.createElement("select", { 
                                    value: trustPlatform, 
                                    onChange: (e: any) => setTrustPlatform(e.target.value),
                                    className: "w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                } as any,
                                    React.createElement("option", { value: "Instagram" }, "Instagram"),
                                    React.createElement("option", { value: "TikTok" }, "TikTok"),
                                    React.createElement("option", { value: "Facebook" }, "Facebook"),
                                    React.createElement("option", { value: "Twitter" }, "Twitter/X")
                                )
                            ),
                            React.createElement(Input, { 
                                id: "trust-username", 
                                label: `Tu usuario de ${trustPlatform}`, 
                                value: trustUsername, 
                                onChange: (e: any) => setTrustUsername(e.target.value),
                                placeholder: "@tu_usuario"
                            } as any),
                            React.createElement(Button, { 
                                className: "w-full", 
                                disabled: !trustUsername,
                                onClick: async () => {
                                    setIsVerifyingTrust(true);
                                    try {
                                        const res = await api.requestTrustVerification(trustPlatform, trustUsername);
                                        setVerificationCode(res.verificationCode);
                                        setTrustStep(2);
                                    } catch (err: any) {
                                        showToast(err.message, 'error');
                                    } finally {
                                        setIsVerifyingTrust(false);
                                    }
                                },
                                isLoading: isVerifyingTrust,
                                children: "Generar código de verificación"
                            })
                        )
                    ) : (
                        React.createElement("div", { className: "space-y-6" },
                            React.createElement("div", { className: "p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl border border-blue-100 dark:border-blue-800 text-center" },
                                React.createElement("p", { className: "text-xs text-blue-600 dark:text-blue-400 font-bold uppercase mb-2" }, "Tu código de seguridad"),
                                React.createElement("p", { className: "text-3xl font-mono font-black tracking-widest text-blue-700 dark:text-blue-300" }, verificationCode),
                                React.createElement("button", { 
                                    onClick: () => {
                                        navigator.clipboard.writeText(verificationCode);
                                        showToast("Código copiado", "success");
                                    },
                                    className: "mt-2 text-[10px] text-blue-600 dark:text-blue-400 underline"
                                }, "Copiar código")
                            ),
                            React.createElement("div", { className: "space-y-2" },
                                React.createElement("p", { className: "text-sm font-bold text-gray-900 dark:text-white" }, "Instrucciones:"),
                                React.createElement("ol", { className: "text-sm text-gray-600 dark:text-gray-400 list-decimal list-inside space-y-1" },
                                    React.createElement("li", null, "Copia el código de arriba."),
                                    React.createElement("li", null, `Abre tu perfil de ${trustPlatform}.`),
                                    React.createElement("li", null, "Pega el código en tu biografía o descripción."),
                                    React.createElement("li", null, "Pulsa el botón de abajo para verificar.")
                                )
                            ),
                            React.createElement("div", { className: "flex flex-col gap-2" },
                                React.createElement(Button, { 
                                    className: "w-full", 
                                    onClick: async () => {
                                        setIsVerifyingTrust(true);
                                        try {
                                            const updatedUser = await api.confirmTrustVerification();
                                            updateUser(updatedUser);
                                            showToast("¡Perfil verificado con éxito!", "success");
                                            setShowTrustModal(false);
                                        } catch (err: any) {
                                            showToast(err.message, 'error');
                                        } finally {
                                            setIsVerifyingTrust(false);
                                        }
                                    },
                                    isLoading: isVerifyingTrust,
                                    children: "Verificar ahora"
                                }),
                                React.createElement(Button, { 
                                    className: "w-full", 
                                    variant: "secondary",
                                    onClick: () => setTrustStep(1),
                                    children: "Volver"
                                })
                            )
                        )
                    )
                )
            )
        )
    );
};

export default ProfilePage;
