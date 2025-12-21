
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.tsx';
import Button from '../components/Button.tsx';
import Input from '../components/Input.tsx';
import { ICONS } from '../constants.tsx';
import { api } from '../services/api.ts';
import ItemCard from '../components/ItemCard.tsx';
import SwapSpinner from '../components/SwapSpinner.tsx';
import PreferencesModal from '../components/PreferencesModal.tsx';
import AutocompleteInput from '../components/AutocompleteInput.tsx';
import EmptyState from '../components/EmptyState.tsx';
import { useToast } from '../hooks/useToast.tsx';
import { locations } from '../data/locations.ts';
import { useColorTheme } from '../hooks/useColorTheme.tsx';

// ProfileSection component for organizing profile fields
const ProfileSection = ({ title, children, onEdit, isEditing, onSave, onCancel, isLoading, isEditable, disabledReason }) => {
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
                        title: !isEditable ? renderDisabledReason() : 'Editar'
                    }, "Editar")
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

// UserRating component for displaying user stars
const UserRating = ({ ratings = [] }) => {
    const averageRating = useMemo(() => {
        if (!ratings || ratings.length === 0) return 0;
        const total = ratings.reduce((acc, r) => acc + r.rating, 0);
        return total / ratings.length;
    }, [ratings]);

    if (ratings.length === 0) {
        return React.createElement("p", { className: "text-sm text-gray-500 dark:text-gray-400" }, "Aún no tienes valoraciones.");
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
    
    const [editName, setEditName] = useState('');
    const [editCountry, setEditCountry] = useState('');
    const [editCity, setEditCity] = useState('');
    const [editPostalCode, setEditPostalCode] = useState('');
    const [editAddress, setEditAddress] = useState('');
    
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    const [isLoading, setIsLoading] = useState(false);
    const [userItems, setUserItems] = useState([]);
    const [isItemsLoading, setIsItemsLoading] = useState(true);
    const [isEditable, setIsEditable] = useState(true);
    const [disabledReason, setDisabledReason] = useState(null);

    useEffect(() => {
        if (user) {
            setEditName(user.name);
            setEditCountry(user.location?.country || '');
            setEditCity(user.location?.city || '');
            setEditPostalCode(user.location?.postalCode || '');
            setEditAddress(user.location?.address || '');
            fetchUserItems();
            checkEditableStatus();
        }
    }, [user]);

    useEffect(() => {
        if (location.state?.message) {
            showToast(location.state.message, 'success');
            // Clear location state to prevent repeat toasts
            window.history.replaceState({}, document.title);
        }
    }, [location.state, showToast]);

    const fetchUserItems = async () => {
        if (!user) return;
        try {
            setIsItemsLoading(true);
            const items = await api.getUserItems(user.id);
            setUserItems(items);
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
                React.createElement(Button, { variant: "danger", size: "sm", onClick: logout }, "Cerrar Sesión")
            ),

            React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-8" },
                // Avatar Column
                React.createElement("div", { className: "md:col-span-1" },
                    React.createElement("div", { className: "bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center" },
                        React.createElement("img", { src: user.avatarUrl, alt: "Avatar", className: "w-32 h-32 rounded-full mx-auto object-cover mb-4 shadow-lg border-4 border-white dark:border-gray-700" }),
                        React.createElement("h2", { className: "text-xl font-bold text-gray-900 dark:text-white mb-2" }, user.name),
                        React.createElement(UserRating, { ratings: user.ratings })
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
                                React.createElement(AutocompleteInput, { 
                                    id: "p-country", 
                                    label: "País", 
                                    value: editCountry, 
                                    onChange: setEditCountry, 
                                    suggestions: countries 
                                }),
                                React.createElement(AutocompleteInput, { 
                                    id: "p-city", 
                                    label: "Ciudad", 
                                    value: editCity, 
                                    onChange: setEditCity, 
                                    suggestions: citiesForSelectedCountry,
                                    disabled: !editCountry
                                }),
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
            )
        )
    );
};

export default ProfilePage;
