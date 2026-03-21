
import React, { useState, useEffect } from 'react';
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

const UserRow = ({ user, currentUser, onBan, onUnban, onRoleChange }: { user: any, currentUser: any, onBan: (id: string) => void, onUnban: (id: string) => void, onRoleChange: (id: string, role: string) => void }) => {
    const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';
    const isTargetStaff = user.role !== 'USER';
    
    return (
        React.createElement("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b last:border-0 border-gray-100 dark:border-gray-700 gap-4" },
            React.createElement("div", { className: "flex items-center gap-3 min-w-0" },
                React.createElement("img", { src: user.avatarUrl, className: "w-10 h-10 rounded-full flex-shrink-0 object-cover shadow-sm" }),
                React.createElement("div", { className: "min-w-0" },
                    React.createElement("div", { className: "flex items-center gap-2" },
                        React.createElement("p", { className: "font-bold text-gray-900 dark:text-white truncate" }, user.name),
                        user.role !== 'USER' && React.createElement("span", { className: "flex-shrink-0 px-2 py-0.5 bg-yellow-100 text-yellow-700 text-[10px] font-black rounded border border-yellow-200" }, user.role)
                    ),
                    React.createElement("p", { className: "text-xs text-gray-500 truncate" }, user.email)
                )
            ),
            React.createElement("div", { className: "flex items-center gap-3 sm:justify-end flex-wrap" },
                isSuperAdmin && user.id !== currentUser.id && (
                    React.createElement("select" as any, {
                        value: user.role,
                        onChange: (e: any) => onRoleChange(user.id, e.target.value),
                        className: "text-xs p-1.5 bg-gray-50 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                    } as any,
                        React.createElement("option", { value: "USER" }, "Usuario"),
                        React.createElement("option", { value: "MODERATOR" }, "Moderador"),
                        React.createElement("option", { value: "SUPER_ADMIN" }, "Super Admin")
                    )
                ),
                user.role !== 'SUPER_ADMIN' && (
                    user.isBanned ? (
                        React.createElement(Button, { size: "sm", variant: "secondary", onClick: () => onUnban(user.id), children: "Reactivar" })
                    ) : (
                        // Un moderador normal no puede suspender a otro moderador
                        (currentUser.role === 'SUPER_ADMIN' || !isTargetStaff) && 
                        React.createElement(Button, { size: "sm", variant: "danger", onClick: () => onBan(user.id), children: "Suspender" })
                    )
                )
            )
        )
    );
};

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
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('alerts');
    const { showToast } = useToast();

    const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

    const fetchData = async () => {
        setLoading(true);
        try {
            const [q, s, u, l] = await Promise.all([
                api.getModerationQueue(),
                api.getAdminStats(),
                api.getAllUsersAdmin(),
                api.getModerationLogs()
            ]);
            setQueue(q);
            setStats(s);
            setUsersList(u);
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
        const reason = prompt("Indica el motivo de la suspensión:");
        if (reason) {
            try {
                await api.banUser(uid, reason);
                showToast('Usuario suspendido.', 'success');
                fetchData();
            } catch (e) {
                showToast(e.message, 'error');
            }
        }
    };

    const handleUnban = async (uid) => {
        await api.unbanUser(uid);
        showToast('Usuario reactivado.', 'success');
        fetchData();
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
        { id: 'rules', label: 'Reglas de Filtro' },
        { id: 'logs', label: 'Historial' },
        { id: 'maintenance', label: 'Mantenimiento' }
    ];

    const handleForceSeed = async () => {
        if (!confirm("¿Estás seguro de que quieres forzar el sembrado de datos? Esto creará usuarios y artículos de prueba si no existen.")) return;
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
                        React.createElement("div", { className: "flex flex-col sm:flex-row justify-center gap-4" },
                            React.createElement(Button, { onClick: handleForceSeed, children: "Forzar Sembrado de Datos" }),
                            React.createElement(Button, { variant: "outline", onClick: fetchData, children: "Refrescar Estadísticas" })
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
                React.createElement("div", { className: "bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden animate-fade-in-up" },
                    usersList.map(u => React.createElement(UserRow, { key: u.id, user: u, currentUser, onBan: handleBan, onUnban: handleUnban, onRoleChange: handleRoleChange }))
                )
            ),

            activeTab === 'rules' && (
                React.createElement("div", { className: "space-y-6 animate-fade-in-up" },
                    React.createElement("div", { className: "bg-blue-50 dark:bg-blue-900/20 p-4 sm:p-6 rounded-2xl border border-blue-100 dark:border-blue-800 flex flex-col sm:flex-row justify-between items-center gap-4" },
                        React.createElement("div", { className: "text-center sm:text-left" },
                            React.createElement("h3", { className: "text-base sm:text-lg font-bold text-blue-800 dark:text-blue-300 mb-2" }, "🛡️ Filtro Automático de Contenido"),
                            React.createElement("p", { className: "text-xs sm:text-sm text-blue-600 dark:text-blue-400" }, "Cualquier artículo que contenga estas palabras será bloqueado automáticamente y enviado a revisión.")
                        ),
                        React.createElement(Button, { size: "sm", className: "w-full sm:w-auto", onClick: async () => {
                            const cat = prompt("Nombre de la nueva categoría:");
                            if (cat) {
                                await api.addFilterCategory(cat.toUpperCase());
                                fetchData();
                            }
                        }, children: "+ Nueva Categoría" })
                    ),
                    Object.entries(api._getFilters()).map(([category, words]) => (
                        React.createElement("div", { key: category, className: "bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700" },
                            React.createElement("div", { className: "flex flex-col sm:flex-row justify-between items-center mb-4 gap-2" },
                                React.createElement("h4", { className: "text-xs font-black text-gray-400 uppercase tracking-widest" }, category),
                                React.createElement("button", { 
                                    onClick: async () => {
                                        const word = prompt(`Añadir palabra a ${category}:`);
                                        if (word) {
                                            await api.addFilterWord(category, word);
                                            fetchData();
                                        }
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
                                                if (confirm(`¿Eliminar "${word}" del filtro?`)) {
                                                    await api.removeFilterWord(category, word);
                                                    fetchData();
                                                }
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
            )
        )
    );
};

export default AdminPage;
