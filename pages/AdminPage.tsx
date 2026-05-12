
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api.ts';
import SwapSpinner from '../components/SwapSpinner.tsx';
import Button from '../components/Button.tsx';
import { useToast } from '../hooks/useToast.tsx';
import { useAuth } from '../hooks/useAuth.tsx';

const StatsCard = ({ title, value, icon, variant }: { title: string, value: any, icon: string, variant: string }) => {
    const variants = {
        blue: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
        green: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
        purple: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
        orange: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
    };
    
    return React.createElement("div", { className: "bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4 min-w-0" },
        React.createElement("div", { className: `p-3 sm:p-4 rounded-xl text-xl sm:text-2xl flex-shrink-0 ${variants[variant] || variants.blue}` }, icon),
        React.createElement("div", { className: "min-w-0" },
            React.createElement("p", { className: "text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium truncate" }, title),
            React.createElement("p", { className: "text-xl sm:text-2xl font-black text-gray-900 dark:text-white truncate" }, value)
        )
    );
};

const UserRow = ({ user, currentUser, onBan, onUnban, onRoleChange, onDelete }: { user: any, currentUser: any, onBan: (id: string) => void, onUnban: (id: string) => void, onRoleChange: (id: string, role: string) => void, onDelete: (id: string) => void }) => {
    const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';
    const isTargetStaff = user.role !== 'USER';
    const [isManaging, setIsManaging] = useState(false);
    
    return (
        React.createElement("div", { className: `flex flex-col p-4 border-b last:border-0 border-gray-100 dark:border-gray-700 transition-colors ${isManaging ? 'bg-gray-50 dark:bg-gray-800' : ''}` },
            React.createElement("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-4" },
                React.createElement(Link, { to: `/profile/${user.id}`, className: "flex items-center gap-3 min-w-0 hover:bg-gray-50 dark:hover:bg-gray-800 p-1 rounded-lg transition-colors" },
                    React.createElement("img", { src: user.avatarUrl, className: "w-12 h-12 rounded-full flex-shrink-0 object-cover shadow-sm bg-gray-100" }),
                    React.createElement("div", { className: "min-w-0 flex-1" },
                        React.createElement("div", { className: "flex items-center gap-2" },
                            React.createElement("span", { className: "font-bold text-gray-900 dark:text-white truncate" }, user.name),
                            user.role !== 'USER' && React.createElement("span", { className: "flex-shrink-0 px-2 py-0.5 bg-yellow-100 text-yellow-700 text-[10px] font-black rounded border border-yellow-200" }, user.role)
                        ),
                        React.createElement("p", { className: "text-xs text-gray-500 truncate font-mono" }, user.email),
                        React.createElement("p", { className: "text-[10px] text-gray-400 mt-0.5" }, "ID: ", user.id)
                    )
                ),
                React.createElement("div", { className: "flex items-center gap-2 md:justify-end" },
                    React.createElement("button", { onClick: () => setIsManaging(!isManaging), className: "text-xs px-3 py-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 rounded-lg font-bold transition-colors" }, isManaging ? "Cerrar Gestión" : "Gestionar")
                )
            ),
            isManaging && React.createElement("div", { className: "mt-4 pt-4 border-t border-gray-200 dark:border-gray-600 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-white dark:bg-gray-900 p-4 rounded-xl shadow-inner animate-fade-in" },
                React.createElement("div", { className: "flex items-center gap-3" },
                    isSuperAdmin && user.id !== currentUser.id && (
                        React.createElement("div", { className: "flex items-center gap-2" },
                            React.createElement("span", { className: "text-xs font-bold text-gray-500" }, "Rol:"),
                            React.createElement("select" as any, {
                                value: user.role,
                                onChange: (e: any) => onRoleChange(user.id, e.target.value),
                                className: "text-xs p-1.5 bg-gray-50 border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 font-bold"
                            } as any,
                                React.createElement("option", { value: "USER" }, "USUARIO ESTÁNDAR"),
                                React.createElement("option", { value: "MODERATOR" }, "MODERADOR"),
                                React.createElement("option", { value: "SUPER_ADMIN" }, "SUPER ADMIN")
                            )
                        )
                    )
                ),
                React.createElement("div", { className: "flex items-center gap-2 flex-wrap" },
                    user.id !== currentUser.id && (currentUser.role === 'SUPER_ADMIN' || user.role !== 'SUPER_ADMIN') && (
                        user.isBanned ? (
                            React.createElement(React.Fragment, null,
                                React.createElement(Button, { size: "sm", variant: "secondary", onClick: () => onUnban(user.id), children: "Reactivar" }),
                                (currentUser.role === 'SUPER_ADMIN' || !isTargetStaff) && React.createElement(Button, { size: "sm", variant: "danger", onClick: () => onDelete(user.id), children: "Eliminar Definitivamente" })
                            )
                        ) : (
                            (currentUser.role === 'SUPER_ADMIN' || !isTargetStaff) && 
                            React.createElement(React.Fragment, null,
                                React.createElement(Button, { size: "sm", variant: "warning", onClick: () => onBan(user.id), children: "Suspender Cuenta" }),
                                React.createElement(Button, { size: "sm", variant: "danger", onClick: () => onDelete(user.id), children: "Eliminar Definitivamente" })
                            )
                        )
                    )
                )
            )
        )
    );
};

const ItemRow = ({ item, onDelete }: { item: any, onDelete: (id: string) => void }) => (
    React.createElement("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b last:border-0 border-gray-100 dark:border-gray-700 gap-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors" },
        React.createElement("div", { className: "flex items-center gap-3 min-w-0" },
            React.createElement("img", { src: item.imageUrls?.[0] || 'https://via.placeholder.com/40', className: "w-12 h-12 rounded object-cover shadow-sm bg-gray-100" }),
            React.createElement("div", { className: "min-w-0" },
                React.createElement(Link, { to: `/item/${item.id}`, className: "font-bold text-gray-900 dark:text-white truncate hover:underline" }, item.title),
                React.createElement("div", { className: "flex items-center gap-1 mt-0.5" },
                    React.createElement("span", { className: "text-[10px] bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-300 font-bold" }, item.category),
                    React.createElement("span", { className: "text-[10px] text-gray-500 truncate" }, "por ", React.createElement(Link, { to: `/profile/${item.userId}`, className: "hover:underline" }, item.ownerName || 'Usuario Desconocido'))
                )
            )
        ),
        React.createElement("div", { className: "flex items-center gap-3 sm:justify-end flex-wrap" },
            React.createElement(Link, { to: `/item/${item.id}`, className: "text-xs px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg font-bold" }, "Ver Artículo"),
            React.createElement(Button, { size: "sm", variant: "danger", onClick: () => onDelete(item.id), children: "Eliminar" })
        )
    )
);

const LogItem = ({ log }) => (
    React.createElement("div", { className: "p-4 bg-white dark:bg-gray-800 border-b last:border-0 border-gray-100 dark:border-gray-700 text-sm min-w-0" },
        React.createElement("div", { className: "flex justify-between items-start mb-1 gap-2" },
            React.createElement("span", { className: "font-black text-blue-600 dark:text-blue-400 uppercase text-[10px] tracking-widest flex-shrink-0" }, log.action),
            React.createElement("span", { className: "text-[10px] text-gray-400 font-mono truncate" }, new Date(log.timestamp).toLocaleString())
        ),
        React.createElement("p", { className: "text-gray-900 dark:text-white break-words" }, 
            React.createElement("span", { className: "font-bold" }, log.adminName),
            " actuó sobre ",
            React.createElement("span", { className: "font-mono text-xs bg-gray-100 dark:bg-gray-900 px-1 rounded break-all" }, log.targetId),
            ": ",
            React.createElement("span", { className: "italic text-gray-600 dark:text-gray-400" }, log.details)
        )
    )
);

const AdminPage = () => {
    const { user: currentUser } = useAuth();
    const [queue, setQueue] = useState([]);
    const [stats, setStats] = useState(null);
    const [usersList, setUsersList] = useState([]);
    const [itemsList, setItemsList] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('alerts');
    const [userSearch, setUserSearch] = useState('');
    const [itemSearch, setItemSearch] = useState('');
    const [usersPage, setUsersPage] = useState(1);
    const [itemsPage, setItemsPage] = useState(1);
    const [confirmDialog, setConfirmDialog] = useState<{isOpen: boolean, message: string, onConfirm: () => void}>({
        isOpen: false,
        message: '',
        onConfirm: () => {}
    });
    const [promptDialog, setPromptDialog] = useState<{isOpen: boolean, message: string, onConfirm: (val: string) => void}>({
        isOpen: false,
        message: '',
        onConfirm: () => {}
    });
    const [promptValue, setPromptValue] = useState("");
    const { showToast } = useToast();

    const requestConfirm = (message: string, onConfirm: () => void) => {
        setConfirmDialog({
            isOpen: true,
            message,
            onConfirm: () => {
                setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                onConfirm();
            }
        });
    };

    const requestPrompt = (message: string, onConfirm: (val: string) => void) => {
        setPromptValue("");
        setPromptDialog({
            isOpen: true,
            message,
            onConfirm: (val) => {
                setPromptDialog(prev => ({ ...prev, isOpen: false }));
                onConfirm(val);
            }
        });
    };

    const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

    const fetchData = async () => {
        setLoading(true);
        try {
            const [q, s, u, i, l] = await Promise.all([
                api.getModerationQueue(),
                api.getAdminStats(),
                api.getAllUsersAdmin(),
                api.getAllItemsAdmin(),
                api.getModerationLogs()
            ]);
            setQueue(q);
            setStats(s);
            setUsersList(u);
            setItemsList(i);
            setLogs(l);
        } catch (e) {
            showToast("Error cargando datos de administración", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [currentUser]);

    const handleResolve = async (alertId, type, action) => {
        await api.resolveModeration(alertId, type, action);
        showToast('Acción completada.', 'success');
        fetchData();
    };

    const handleBan = async (uid) => {
        requestPrompt("Indica el motivo de la suspensión:", async (reason) => {
            if (reason) {
                try {
                    await api.banUser(uid, reason);
                    showToast('Usuario suspendido.', 'success');
                    fetchData();
                } catch (e) {
                    showToast(e.message, 'error');
                }
            }
        });
    };

    const handleUnban = async (uid) => {
        await api.unbanUser(uid);
        showToast('Usuario reactivado.', 'success');
        fetchData();
    };

    const handleDeleteUser = async (uid) => {
        if (uid === currentUser?.id) {
            showToast('No puedes eliminar tu propia sesión activa desde el panel de administrador.', 'error');
            return;
        }
        requestConfirm("¿Estás seguro de que quieres eliminar la base de datos de este usuario? Ten en cuenta que para eliminar su cuenta de autenticación (Login) debes hacerlo desde Firebase Console manualmente debido a restricciones de seguridad.", async () => {
            try {
                await api.deleteUserAdmin(uid);
                showToast('Datos de usuario eliminados.', 'success');
                fetchData();
            } catch (e) {
                showToast(e.message, 'error');
            }
        });
    };

    const handleDeleteItem = async (itemId) => {
        requestConfirm("¿Estás seguro de que quieres eliminar este artículo?", async () => {
            try {
                await api.deleteItem(itemId);
                showToast('Artículo eliminado.', 'success');
                fetchData();
            } catch (e) {
                showToast(e.message, 'error');
            }
        });
    };

    const handleRoleChange = async (uid, newRole) => {
        try {
            await api.assignRole(uid, newRole);
            showToast(`Rol actualizado a ${newRole}`, 'success');
            fetchData();
        } catch (e) {
            showToast(e.message, 'error');
        }
    };

    if (loading) return React.createElement("div", { className: "flex justify-center p-20" }, React.createElement(SwapSpinner, { size: "lg" }));

    const tabs = [
        { id: 'alerts', label: `Alertas (${queue.length})` },
        { id: 'users', label: 'Usuarios' },
        { id: 'items', label: 'Artículos' },
        { id: 'rules', label: 'Reglas de Filtro' },
        { id: 'logs', label: 'Historial' },
        { id: 'maintenance', label: 'Mantenimiento' }
    ];

    const handleForceSeed = async () => {
        requestConfirm("¿Estás seguro de que quieres forzar el sembrado de datos? Esto creará usuarios y artículos de prueba si no existen.", async () => {
            setLoading(true);
            try {
                const { seedAllData } = await import('../services/seedData.ts');
                await seedAllData();
                showToast("Datos sembrados correctamente", "success");
                await fetchData();
            } catch (e) {
                showToast("Error al sembrar datos", "error");
            } finally {
                setLoading(false);
            }
        });
    };

    const filteredUsers = usersList.filter((u: any) => 
        (u.name && u.name.toLowerCase().includes(userSearch.toLowerCase())) || 
        (u.email && u.email.toLowerCase().includes(userSearch.toLowerCase()))
    );
    const paginatedUsers = filteredUsers.slice((usersPage - 1) * 20, usersPage * 20);
    const totalUserPages = Math.ceil(filteredUsers.length / 20) || 1;

    const filteredItems = itemsList.filter((i: any) => 
        (i.title && i.title.toLowerCase().includes(itemSearch.toLowerCase())) || 
        (i.ownerName && i.ownerName.toLowerCase().includes(itemSearch.toLowerCase())) ||
        (i.category && i.category.toLowerCase().includes(itemSearch.toLowerCase()))
    );
    const paginatedItems = filteredItems.slice((itemsPage - 1) * 20, itemsPage * 20);
    const totalItemPages = Math.ceil(filteredItems.length / 20) || 1;

    const handleCleanDuplicates = async () => {
        requestConfirm("¿Estás seguro de que quieres eliminar los usuarios duplicados? Esto mantendrá la cuenta más antigua o la que sea admin para cada email.", async () => {
            setLoading(true);
            try {
                const emailGroups = usersList.reduce((acc: any, user: any) => {
                    const email = user.email || user.username || 'unknown';
                    if (!acc[email]) acc[email] = [];
                    acc[email].push(user);
                    return acc;
                }, {});

                let deletedCount = 0;
                for (const email of Object.keys(emailGroups)) {
                    if (email === 'unknown') continue;
                    const users = emailGroups[email];
                    if (users.length > 1) {
                        // Sort so SUPER_ADMIN is kept, then oldest
                        users.sort((a: any, b: any) => {
                            if (a.role === 'SUPER_ADMIN' && b.role !== 'SUPER_ADMIN') return -1;
                            if (b.role === 'SUPER_ADMIN' && a.role !== 'SUPER_ADMIN') return 1;
                            const aTime = a.createdAt?.toMillis?.() || 0;
                            const bTime = b.createdAt?.toMillis?.() || 0;
                            return aTime - bTime;
                        });
                        
                        // Delete all except the first one
                        const toDelete = users.slice(1);
                        for (const u of toDelete) {
                            try {
                                await api.deleteUserAdmin(u.id);
                                deletedCount++;
                            } catch (e) {
                                console.error(`Failed to delete duplicate ${u.id}`, e);
                            }
                        }
                    }
                }
                showToast(`Se eliminaron ${deletedCount} usuarios duplicados.`, "success");
                await fetchData();
            } catch (e: any) {
                showToast("Error al limpiar duplicados: " + e.message, "error");
            } finally {
                setLoading(false);
            }
        });
    };

    return (
        React.createElement("div", { className: "w-full animate-fade-in" },
            React.createElement("header", { className: "mb-10" },
                React.createElement("div", { className: "flex items-center gap-3 mb-2 flex-wrap" },
                    React.createElement("span", { className: "p-2 bg-yellow-100 text-yellow-700 rounded-lg text-[10px] sm:text-sm font-black" }, "🛡️ STAFF"),
                    React.createElement("h1", { className: "text-2xl sm:text-4xl font-black text-gray-900 dark:text-white" }, "Centro de Control")
                ),
                React.createElement("p", { className: "text-sm sm:text-base text-gray-500" }, "Gestiona la integridad de la comunidad y supervisa la actividad.")
            ),

            React.createElement("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-10" },
                React.createElement(StatsCard, { title: "Swappers", value: stats?.totalUsers, icon: "👤", variant: "blue" }),
                React.createElement(StatsCard, { title: "Artículos", value: stats?.totalItems, icon: "📦", variant: "green" }),
                React.createElement(StatsCard, { title: "Intercambios", value: stats?.totalExchanges, icon: "🤝", variant: "purple" }),
                React.createElement(StatsCard, { title: "Alertas", value: stats?.pendingAlerts, icon: "⚠️", variant: "orange" })
            ),

            React.createElement("div", { className: "mb-8 bg-gray-100 dark:bg-gray-800/50 p-1.5 rounded-2xl flex flex-wrap md:flex-nowrap gap-1" },
                tabs.map(tab => (
                    React.createElement("button", { 
                        key: tab.id,
                        onClick: () => setActiveTab(tab.id),
                        className: `flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${activeTab === tab.id ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`
                    }, 
                        tab.id === 'alerts' && "⚠️",
                        tab.id === 'users' && "👥",
                        tab.id === 'items' && "📦",
                        tab.id === 'rules' && "🛡️",
                        tab.id === 'logs' && "📜",
                        tab.id === 'maintenance' && "🛠️",
                        tab.label
                    )
                ))
            ),

            activeTab === 'maintenance' && (
                React.createElement("div", { className: "space-y-6 animate-fade-in-up" },
                    React.createElement("div", { className: "bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 text-center" },
                        React.createElement("div", { className: "w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl" }, "🛠️"),
                        React.createElement("h3", { className: "text-2xl font-black text-gray-900 dark:text-white mb-4" }, "Herramientas de Mantenimiento"),
                        React.createElement("p", { className: "text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto" }, 
                            "Si la aplicación parece vacía o necesitas restaurar los datos de prueba, puedes forzar el sembrado de datos inicial."
                        ),
                        React.createElement("div", { className: "flex flex-col sm:flex-row justify-center gap-4 flex-wrap" },
                            React.createElement(Button, { onClick: handleForceSeed, children: "Forzar Sembrado de Datos" }),
                            React.createElement(Button, { variant: "outline", onClick: fetchData, children: "Refrescar Estadísticas" }),
                            React.createElement(Button, { variant: "danger", onClick: handleCleanDuplicates, children: "Limpiar Usuarios Duplicados" })
                        )
                    )
                )
            ),

            activeTab === 'alerts' && (
                React.createElement("div", { className: "space-y-4" },
                    queue.length === 0 ? (
                        React.createElement("div", { className: "text-center py-20 bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 animate-fade-in-up" },
                            React.createElement("span", { className: "text-5xl mb-4 block" }, "✅"),
                            React.createElement("h3", { className: "text-xl font-bold dark:text-white" }, "Todo en orden"),
                            React.createElement("p", { className: "text-gray-500" }, "No hay reportes ni detecciones automáticas pendientes.")
                        )
                    ) : (
                        queue.map(item => (
                            React.createElement("div", { key: item.id, className: `bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-2xl shadow-sm border-l-8 ${item.isAuto ? 'border-orange-500' : 'border-red-600'} flex flex-col md:flex-row justify-between items-start md:items-center gap-6 animate-fade-in-up hover:shadow-md transition-shadow` },
                                React.createElement("div", { className: "flex-grow min-w-0" },
                                    React.createElement("div", { className: "flex items-center gap-2 mb-2" },
                                        React.createElement("span", { className: `px-2 py-0.5 rounded text-[10px] font-black uppercase ${item.isAuto ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}` },
                                            item.isAuto ? '🤖 IA DETECT' : '👤 USER REPORT'
                                        ),
                                        React.createElement("span", { className: "text-[10px] text-gray-400 font-bold" }, new Date(item.date).toLocaleString())
                                    ),
                                    React.createElement("h3", { className: "text-xl font-bold mb-1 dark:text-white truncate" }, item.preview),
                                    React.createElement("p", { className: "text-sm text-gray-600 dark:text-gray-400 italic bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg break-words" }, `"${item.reason}"`),
                                    item.type === 'TRUST_VERIFICATION' && React.createElement("div", { className: "mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800" },
                                        React.createElement("p", { className: "text-xs font-bold text-blue-800 dark:text-blue-300 mb-1" }, "Perfil Social: ", React.createElement("a", { href: item.data?.socialLink, target: "_blank", className: "underline" }, item.data?.socialLink)),
                                        React.createElement("p", { className: "text-[10px] text-gray-500 mt-1" }, "Verifica que el perfil coincida con el nombre del usuario.")
                                    ),
                                    React.createElement("p", { className: "text-xs text-gray-400 mt-2 truncate" }, "Informado por: ", React.createElement("span", { className: "font-bold text-gray-600 dark:text-gray-300" }, item.reporterName))
                                ),
                                React.createElement("div", { className: "flex gap-2 w-full md:w-auto flex-shrink-0" },
                                    item.type === 'TRUST_VERIFICATION' ? (
                                        React.createElement(React.Fragment, null,
                                            React.createElement(Button, { size: "sm", variant: "secondary", onClick: () => handleResolve(item.id, item.type, 'REJECT'), children: "Rechazar" }),
                                            React.createElement(Button, { size: "sm", variant: "primary", onClick: () => handleResolve(item.id, item.type, 'APPROVE'), children: "Aprobar" })
                                        )
                                    ) : (
                                        React.createElement(React.Fragment, null,
                                            React.createElement(Button, { size: "sm", variant: "secondary", onClick: () => handleResolve(item.id, item.type, 'APPROVE'), children: "Ignorar" }),
                                            React.createElement(Button, { size: "sm", variant: "danger", onClick: () => handleResolve(item.id, item.type, 'DELETE'), children: "Eliminar" })
                                        )
                                    )
                                )
                            )
                        ))
                    )
                )
            ),

            activeTab === 'users' && (
                React.createElement("div", { className: "space-y-4 animate-fade-in-up" },
                    React.createElement("div", { className: "flex flex-col sm:flex-row justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 gap-4" },
                        React.createElement("div", { className: "relative w-full sm:w-96" },
                            React.createElement("span", { className: "absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500" }, "🔍"),
                            React.createElement("input", { 
                                type: "text", 
                                placeholder: "Buscar usuario por nombre o email...", 
                                value: userSearch,
                                onChange: (e) => { setUserSearch(e.target.value); setUsersPage(1); },
                                className: "w-full pl-10 pr-4 py-2 border rounded-xl bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm dark:text-white"
                            })
                        ),
                        React.createElement("div", { className: "text-sm text-gray-500 font-bold" }, `${filteredUsers.length} usuarios encontrados`)
                    ),
                    React.createElement("div", { className: "bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden" },
                        paginatedUsers.length > 0 ? paginatedUsers.map(u => React.createElement(UserRow, { key: u.id, user: u, currentUser, onBan: handleBan, onUnban: handleUnban, onRoleChange: handleRoleChange, onDelete: handleDeleteUser })) : React.createElement("div", { className: "p-10 text-center text-gray-500" }, "No se encontraron usuarios."),
                        totalUserPages > 1 && React.createElement("div", { className: "p-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50" },
                            React.createElement(Button, { size: "sm", variant: "secondary", onClick: () => setUsersPage(p => Math.max(1, p - 1)), disabled: usersPage === 1 }, "Anterior"),
                            React.createElement("span", { className: "text-sm text-gray-500 font-bold" }, `Página ${usersPage} de ${totalUserPages}`),
                            React.createElement(Button, { size: "sm", variant: "secondary", onClick: () => setUsersPage(p => Math.min(totalUserPages, p + 1)), disabled: usersPage === totalUserPages }, "Siguiente")
                        )
                    )
                )
            ),

            activeTab === 'items' && (
                React.createElement("div", { className: "space-y-4 animate-fade-in-up" },
                    React.createElement("div", { className: "flex flex-col sm:flex-row justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 gap-4" },
                        React.createElement("div", { className: "relative w-full sm:w-96" },
                            React.createElement("span", { className: "absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500" }, "🔍"),
                            React.createElement("input", { 
                                type: "text", 
                                placeholder: "Buscar artículo o propietario...", 
                                value: itemSearch,
                                onChange: (e) => { setItemSearch(e.target.value); setItemsPage(1); },
                                className: "w-full pl-10 pr-4 py-2 border rounded-xl bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm dark:text-white"
                            })
                        ),
                        React.createElement("div", { className: "text-sm text-gray-500 font-bold" }, `${filteredItems.length} artículos encontrados`)
                    ),
                    React.createElement("div", { className: "bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden" },
                        paginatedItems.length > 0 ? (
                            paginatedItems.map(item => React.createElement(ItemRow, { key: item.id, item, onDelete: handleDeleteItem }))
                        ) : (
                            React.createElement("div", { className: "p-10 text-center text-gray-500" }, "No se encontraron artículos.")
                        ),
                        totalItemPages > 1 && React.createElement("div", { className: "p-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50" },
                            React.createElement(Button, { size: "sm", variant: "secondary", onClick: () => setItemsPage(p => Math.max(1, p - 1)), disabled: itemsPage === 1 }, "Anterior"),
                            React.createElement("span", { className: "text-sm text-gray-500 font-bold" }, `Página ${itemsPage} de ${totalItemPages}`),
                            React.createElement(Button, { size: "sm", variant: "secondary", onClick: () => setItemsPage(p => Math.min(totalItemPages, p + 1)), disabled: itemsPage === totalItemPages }, "Siguiente")
                        )
                    )
                )
            ),

            activeTab === 'rules' && (
                React.createElement("div", { className: "space-y-6 animate-fade-in-up" },
                    React.createElement("div", { className: "bg-blue-50 dark:bg-blue-900/20 p-4 sm:p-6 rounded-2xl border border-blue-100 dark:border-blue-800 flex flex-col sm:flex-row justify-between items-center gap-4" },
                        React.createElement("div", { className: "text-center sm:text-left" },
                            React.createElement("h3", { className: "text-base sm:text-lg font-bold text-blue-800 dark:text-blue-300 mb-2" }, "🛡️ Filtro Automático de Contenido"),
                            React.createElement("p", { className: "text-xs sm:text-sm text-blue-600 dark:text-blue-400" }, "Cualquier artículo que contenga estas palabras será bloqueado automáticamente y enviado a revisión.")
                        ),
                        React.createElement(Button, { size: "sm", className: "w-full sm:w-auto", onClick: () => {
                            requestPrompt("Nombre de la nueva categoría:", async (cat) => {
                                if (cat) {
                                    await api.addFilterCategory(cat.toUpperCase());
                                    fetchData();
                                }
                            });
                        }, children: "+ Nueva Categoría" })
                    ),
                    Object.entries(api._getFilters()).map(([category, words]) => (
                        React.createElement("div", { key: category, className: "bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700" },
                            React.createElement("div", { className: "flex flex-col sm:flex-row justify-between items-center mb-4 gap-2" },
                                React.createElement("h4", { className: "text-xs font-black text-gray-400 uppercase tracking-widest" }, category),
                                React.createElement("button", { 
                                    onClick: () => {
                                        requestPrompt(`Añadir palabra a ${category}:`, async (word) => {
                                            if (word) {
                                                await api.addFilterWord(category, word);
                                                fetchData();
                                            }
                                        });
                                    },
                                    className: "text-blue-500 hover:text-blue-600 text-xs font-bold"
                                }, "+ Añadir palabra")
                            ),
                            React.createElement("div", { className: "flex flex-wrap gap-2" },
                                (words as string[]).map(word => (
                                    React.createElement("span", { 
                                        key: word, 
                                        className: "group px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full border border-gray-200 dark:border-gray-600 flex items-center gap-2" 
                                    }, 
                                        word,
                                        React.createElement("button", { 
                                            onClick: async () => {
                                                requestConfirm(`¿Eliminar "${word}" del filtro?`, async () => {
                                                    await api.removeFilterWord(category, word);
                                                    fetchData();
                                                });
                                            },
                                            className: "opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity"
                                        }, "✕")
                                    )
                                ))
                            )
                        )
                    ))
                )
            ),

            activeTab === 'logs' && (
                React.createElement("div", { className: "bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden animate-fade-in-up" },
                    logs.length === 0 ? React.createElement("p", { className: "p-12 text-center text-gray-500 italic" }, "No se han registrado acciones de moderación recientemente.") :
                    logs.map(log => React.createElement(LogItem, { key: log.id, log }))
                )
            ),

            confirmDialog.isOpen && (
                React.createElement("div", { className: "fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 animate-fade-in" },
                    React.createElement("div", { className: "bg-white dark:bg-gray-800 rounded-xl max-w-sm w-full p-6 shadow-xl" },
                        React.createElement("h3", { className: "text-lg font-bold text-gray-900 dark:text-white mb-4" }, "Confirmar Acción"),
                        React.createElement("p", { className: "text-gray-600 dark:text-gray-300 mb-6 font-medium" }, confirmDialog.message),
                        React.createElement("div", { className: "flex justify-end gap-3" },
                            React.createElement(Button, { variant: "secondary", onClick: () => setConfirmDialog(prev => ({ ...prev, isOpen: false })) }, "Cancelar"),
                            React.createElement(Button, { variant: "danger", onClick: confirmDialog.onConfirm }, "Confirmar")
                        )
                    )
                )
            ),

            promptDialog.isOpen && (
                React.createElement("div", { className: "fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 animate-fade-in" },
                    React.createElement("div", { className: "bg-white dark:bg-gray-800 rounded-xl max-w-sm w-full p-6 shadow-xl" },
                        React.createElement("h3", { className: "text-lg font-bold text-gray-900 dark:text-white mb-4" }, "Entrada requerida"),
                        React.createElement("p", { className: "text-sm text-gray-600 dark:text-gray-300 mb-4" }, promptDialog.message),
                        React.createElement("input", {
                            type: "text",
                            value: promptValue,
                            onChange: (e) => setPromptValue(e.target.value),
                            autoFocus: true,
                            className: "w-full p-2 mb-6 border rounded-lg bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white",
                            onKeyDown: (e) => {
                                if (e.key === 'Enter') {
                                    promptDialog.onConfirm(promptValue);
                                }
                            }
                        }),
                        React.createElement("div", { className: "flex justify-end gap-3" },
                            React.createElement(Button, { variant: "secondary", onClick: () => setPromptDialog(prev => ({ ...prev, isOpen: false })) }, "Cancelar"),
                            React.createElement(Button, { onClick: () => promptDialog.onConfirm(promptValue) }, "Aceptar")
                        )
                    )
                )
            )
        )
    );
};

export default AdminPage;
