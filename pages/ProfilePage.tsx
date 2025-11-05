import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.tsx';
import Button from '../components/Button.tsx';
import Input from '../components/Input.tsx';
import { ICONS } from '../constants.tsx';
import { api } from '../services/api.ts';
import ItemCard from '../components/ItemCard.tsx';
import SwapSpinner from '../components/SwapSpinner.tsx';
import PreferencesModal from '../components/PreferencesModal.tsx';
import AutocompleteInput from '../components/AutocompleteInput.tsx';
import { locations } from '../data/locations.ts';

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

const ProfilePage = () => {
    const { user, updateUser, refreshUser } = useAuth();
    const navigate = useNavigate();

    // Editability state
    const [editability, setEditability] = useState({ canEdit: false, reason: 'loading' });

    // Editing states
    const [isEditingInfo, setIsEditingInfo] = useState(false);
    const [isEditingSecurity, setIsEditingSecurity] = useState(false);
    const [isEditingLocation, setIsEditingLocation] = useState(false);
    const [isPrefsModalOpen, setIsPrefsModalOpen] = useState(false);
    const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);

    // Form data states
    const [name, setName] = useState(user?.name || '');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [location, setLocation] = useState(user?.location || { country: '', city: '', postalCode: '', address: '' });
    
    // Phone verification state
    const [phone, setPhone] = useState(user?.phone || '');
    const [code, setCode] = useState('');
    const [codeSent, setCodeSent] = useState(false);

    // General states
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [notification, setNotification] = useState({ show: false, message: '' });

    // My Items/Favorites states
    const [items, setItems] = useState([]);
    const [loadingItems, setLoadingItems] = useState(true);
    const [favoriteItems, setFavoriteItems] = useState([]);
    const [loadingFavorites, setLoadingFavorites] = useState(true);
    const [deletingItemId, setDeletingItemId] = useState(null);

    useEffect(() => {
        const checkEditability = async () => {
            try {
                const status = await api.canEditProfile();
                setEditability(status);
            } catch (err) {
                setEditability({ canEdit: false, reason: 'error' });
            }
        };
        checkEditability();
    }, [user]);
    
    useEffect(() => {
        if(user) {
            setName(user.name);
            setLocation(user.location || { country: 'España', city: '', postalCode: '', address: '' });
            setPhone(user.phone || '');
        }
    }, [user]);

    const fetchUserItems = async () => {
        if (!user) return;
        setLoadingItems(true);
        try {
            const userItems = await api.getUserItems(user.id);
            setItems(userItems);
        } catch (err) { console.error(err); } finally { setLoadingItems(false); }
    };

    const fetchFavoriteItems = async () => {
        if (!user) return;
        setLoadingFavorites(true);
        try {
            const favs = await api.getFavoriteItems();
            setFavoriteItems(favs);
        } catch (err) { console.error(err); } finally { setLoadingFavorites(false); }
    };

    useEffect(() => {
        fetchUserItems();
        fetchFavoriteItems();
    }, [user]);
    
    const showNotification = (message) => {
        setNotification({ show: true, message });
        setTimeout(() => setNotification({ show: false, message: '' }), 3000);
    };

    const handleSaveInfo = async () => {
        setIsLoading(true); setError('');
        try {
            const updatedUser = await api.updateUserProfileData({ name });
            updateUser(updatedUser);
            setIsEditingInfo(false);
            showNotification('Información actualizada.');
        } catch (err) { setError(err.message); } finally { setIsLoading(false); }
    };
    
    const handleSaveSecurity = async () => {
        if (newPassword !== confirmPassword) {
            setError('Las nuevas contraseñas no coinciden.');
            return;
        }
        setIsLoading(true); setError('');
        try {
            await api.updateUserPassword(currentPassword, newPassword);
            setIsEditingSecurity(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            showNotification('Contraseña actualizada.');
        } catch (err) { setError(err.message); } finally { setIsLoading(false); }
    };
    
    const handleSaveLocation = async () => {
        setIsLoading(true); setError('');
        try {
            const updatedUser = await api.updateUserProfileData({ location });
            updateUser(updatedUser);
            setIsEditingLocation(false);
            showNotification('Ubicación actualizada.');
        } catch (err) { setError(err.message); } finally { setIsLoading(false); }
    };
    
    const handleSendCode = async (e) => {
        e.preventDefault();
        setIsLoading(true); setError('');
        try {
            await api.changeUserPhone(phone);
            setCodeSent(true);
        } catch (err) { setError(err.message); } finally { setIsLoading(false); }
    };
    
    const handleVerifyCode = async (e) => {
        e.preventDefault();
        setIsLoading(true); setError('');
        try {
            const success = await api.verifyPhoneCode(code);
            if (success) {
                await refreshUser();
                setIsPhoneModalOpen(false);
                setCodeSent(false);
                showNotification('Teléfono verificado.');
            } else {
                setError('Código incorrecto.');
            }
        } catch (err) { setError(err.message); } finally { setIsLoading(false); }
    };

    const handleSavePreferences = async (newPreferences) => {
        try {
            const updatedUser = await api.updateUserPreferences(newPreferences);
            updateUser(updatedUser);
            showNotification('Intereses guardados.');
        } catch (error) {
            setError('Error al guardar las preferencias.');
        }
    };
    
    const handleDeleteItem = async (itemId) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este artículo?')) {
            setDeletingItemId(itemId);
            try {
                await api.deleteItem(itemId);
                setItems(prev => prev.filter(i => i.id !== itemId));
                showNotification('Artículo eliminado.');
            } catch (err) {
                setError(err.message);
            } finally {
                setDeletingItemId(null);
            }
        }
    };

    const handleToggleFavorite = async (itemId) => {
        try {
            await api.toggleFavorite(itemId);
            setFavoriteItems(prev => prev.filter(i => i.id !== itemId));
        } catch (err) { console.error(err); }
    };
    
    const countries = useMemo(() => Object.keys(locations), []);
    const citiesForSelectedCountry = useMemo(() => {
        return location.country && locations[location.country] ? locations[location.country] : [];
    }, [location.country]);

    if (!user) return React.createElement(SwapSpinner, null);

    const PhoneVerificationModal = () => (
        React.createElement("div", { className: "fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4", onClick: () => setIsPhoneModalOpen(false) },
            React.createElement("div", { className: "bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md", onClick: e => e.stopPropagation() },
                React.createElement("div", { className: "p-4 border-b dark:border-gray-700" }, React.createElement("h3", { className: "text-xl font-bold" }, "Cambiar Teléfono")),
                React.createElement("div", { className: "p-6" },
                    error && React.createElement("p", { className: "text-red-500 text-sm mb-4" }, error),
                    !codeSent ? (
                        React.createElement("form", { onSubmit: handleSendCode, className: "space-y-4" },
                            React.createElement(Input, { id: "phone-reverify", label: "Nuevo número de teléfono", type: "tel", value: phone, onChange: e => setPhone(e.target.value), required: true }),
                            React.createElement(Button, { type: "submit", isLoading: isLoading, children: "Enviar Código" })
                        )
                    ) : (
                        React.createElement("form", { onSubmit: handleVerifyCode, className: "space-y-4" },
                            React.createElement("p", { className: "text-sm text-green-600" }, "Código enviado a ", phone, " (Pista: 123456)"),
                            React.createElement(Input, { id: "code-reverify", label: "Código de Verificación", type: "text", value: code, onChange: e => setCode(e.target.value), required: true }),
                            React.createElement(Button, { type: "submit", isLoading: isLoading, children: "Verificar y Guardar" })
                        )
                    )
                )
            )
        )
    );

    return React.createElement("div", { className: "max-w-4xl mx-auto" },
        isPrefsModalOpen && React.createElement(PreferencesModal, { 
            isOpen: isPrefsModalOpen,
            onClose: () => setIsPrefsModalOpen(false),
            initialPreferences: user.preferences || [],
            onSave: handleSavePreferences
        }),
        isPhoneModalOpen && React.createElement(PhoneVerificationModal, null),
        notification.show && React.createElement("div", { className: `fixed bottom-5 right-5 bg-green-100 border-green-400 text-green-700 dark:bg-green-800 dark:border-green-600 dark:text-green-200 px-4 py-3 rounded-lg shadow-lg z-50`}, notification.message),
        React.createElement("h1", { className: "text-3xl font-bold mb-6 text-gray-900 dark:text-white" }, "Mi Perfil"),
        
        React.createElement(ProfileSection, {
            title: "Información Personal",
            onEdit: () => setIsEditingInfo(true),
            isEditing: isEditingInfo,
            onSave: handleSaveInfo,
            onCancel: () => { setIsEditingInfo(false); setError(''); setName(user.name); },
            isLoading: isLoading,
            isEditable: editability.canEdit,
            disabledReason: editability.reason
        },
            error && isEditingInfo && React.createElement("p", { className: "text-red-500 text-sm mb-2" }, error),
            isEditingInfo ? (
                React.createElement(Input, { id: "name", label: "Nombre", value: name, onChange: e => setName(e.target.value) })
            ) : (
                React.createElement("p", null, user.name)
            )
        ),
        
        React.createElement(ProfileSection, {
            title: "Seguridad",
            onEdit: () => setIsEditingSecurity(true),
            isEditing: isEditingSecurity,
            onSave: handleSaveSecurity,
            onCancel: () => { setIsEditingSecurity(false); setError(''); },
            isLoading: isLoading,
            isEditable: editability.canEdit,
            disabledReason: editability.reason
        },
            error && isEditingSecurity && React.createElement("p", { className: "text-red-500 text-sm mb-2" }, error),
            isEditingSecurity ? (
                React.createElement("div", { className: "space-y-4" },
                    React.createElement(Input, { id: "currentPassword", label: "Contraseña Actual", type: "password", value: currentPassword, onChange: e => setCurrentPassword(e.target.value) }),
                    React.createElement(Input, { id: "newPassword", label: "Nueva Contraseña", type: "password", value: newPassword, onChange: e => setNewPassword(e.target.value) }),
                    React.createElement(Input, { id: "confirmPassword", label: "Confirmar Nueva Contraseña", type: "password", value: confirmPassword, onChange: e => setConfirmPassword(e.target.value) })
                )
            ) : (
                React.createElement("div", { className: "space-y-2" },
                    React.createElement("p", null, React.createElement("strong", null, "Correo: "), user.email),
                    React.createElement("p", null, React.createElement("strong", null, "Contraseña: "), "********"),
                    React.createElement("div", { className: "flex justify-between items-center" },
                       React.createElement("p", null, React.createElement("strong", null, "Teléfono (2FA): "), user.phone),
                       React.createElement(Button, {
                           size: "sm",
                           variant: "secondary",
                           onClick: () => setIsPhoneModalOpen(true),
                           disabled: !editability.canEdit,
                           title: !editability.canEdit ? "Edición deshabilitada" : "Cambiar teléfono"
                       }, "Cambiar")
                    )
                )
            )
        ),

        React.createElement(ProfileSection, {
            title: "Ubicación",
            onEdit: () => setIsEditingLocation(true),
            isEditing: isEditingLocation,
            onSave: handleSaveLocation,
            onCancel: () => { setIsEditingLocation(false); setError(''); setLocation(user.location); },
            isLoading: isLoading,
            isEditable: editability.canEdit,
            disabledReason: editability.reason
        },
            error && isEditingLocation && React.createElement("p", { className: "text-red-500 text-sm mb-2" }, error),
            isEditingLocation ? (
                React.createElement("div", { className: "space-y-4" },
                    React.createElement(AutocompleteInput, { id: "country", label: "País", value: location.country, onChange: val => setLocation(l => ({...l, country: val, city: ''})), required: true, suggestions: countries }),
                    React.createElement(AutocompleteInput, { id: "city", label: "Ciudad", value: location.city, onChange: val => setLocation(l => ({...l, city: val})), required: true, suggestions: citiesForSelectedCountry, disabled: !location.country }),
                    React.createElement(Input, { id: "address", label: "Dirección", value: location.address, onChange: e => setLocation(l => ({...l, address: e.target.value})) }),
                    React.createElement(Input, { id: "postalCode", label: "Código Postal", value: location.postalCode, onChange: e => setLocation(l => ({...l, postalCode: e.target.value})) })
                )
            ) : (
                React.createElement("p", null, `${user.location?.address}, ${user.location?.postalCode}, ${user.location?.city}, ${user.location?.country}`)
            )
        ),

        React.createElement("div", { className: "bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8" },
            React.createElement("div", { className: "flex justify-between items-center" },
                React.createElement("h3", { className: "text-xl font-semibold text-gray-900 dark:text-white" }, "Mis Intereses"),
                React.createElement(Button, { variant: "secondary", size: "sm", onClick: () => setIsPrefsModalOpen(true) }, "Editar Intereses")
            ),
            React.createElement("div", { className: "flex flex-wrap gap-2 mt-4" },
                (user.preferences || []).map(p => React.createElement("span", { key: p, className: "bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-blue-900 dark:text-blue-300" }, p))
            )
        ),
        
        React.createElement("div", { className: "mt-8" },
          React.createElement("div", { className: "flex justify-between items-center mb-6" },
            React.createElement("h2", { className: "text-3xl font-bold text-gray-900 dark:text-white" }, "Mis Artículos"),
            React.createElement(Button, { 
              onClick: () => navigate('/add-item'),
              children: React.createElement("div", { className: "flex items-center gap-2" },
                ICONS.plus,
                'Añadir Nuevo Artículo'
              )
            })
          ),
          loadingItems ? React.createElement(SwapSpinner, null) :
          items.length === 0 ? (
            React.createElement("p", { className: "text-center text-gray-500 dark:text-gray-400" }, "Aún no has añadido ningún artículo.")
          ) : (
            React.createElement("div", { className: "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" },
              items.map((item) => React.createElement(ItemCard, { key: item.id, item: item, isOwnItem: true, onDelete: handleDeleteItem, deletingItemId: deletingItemId }))
            )
          )
        ),
        
        React.createElement("div", { className: "mt-8" },
          React.createElement("h2", { className: "text-3xl font-bold text-gray-900 dark:text-white mb-6" }, "Mis Favoritos"),
          loadingFavorites ? React.createElement(SwapSpinner, null) :
          favoriteItems.length === 0 ? (
            React.createElement("p", { className: "text-center text-gray-500 dark:text-gray-400" }, "Aún no has añadido ningún artículo a favoritos.")
          ) : (
            React.createElement("div", { className: "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" },
              favoriteItems.map((item) => React.createElement(ItemCard, { key: item.id, item: item, onToggleFavorite: handleToggleFavorite }))
            )
          )
        )
    );
};

export default ProfilePage;