
import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import SwapSpinner from '../components/SwapSpinner.tsx';
import Button from '../components/Button.tsx';
import { useToast } from '../hooks/useToast.tsx';
import { useAuth } from '../hooks/useAuth.tsx';

const StatsCard = ({ title, value, icon, variant }) => {
    const variants = {
        blue: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
        green: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
        purple: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
        orange: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
    };
    
    return React.createElement("div", { className: "bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4" },
        React.createElement("div", { className: `p-4 rounded-xl text-2xl ${variants[variant] || variants.blue}` }, icon),
        React.createElement("div", null,
            React.createElement("p", { className: "text-sm text-gray-500 dark:text-gray-400 font-medium" }, title),
            React.createElement("p", { className: "text-2xl font-black text-gray-900 dark:text-white" }, value)
        )
    );
};

const UserRow = ({ user, currentUser, onBan, onUnban, onRoleChange }) => {
    const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';
    const isTargetStaff = user.role !== 'USER';
    
    return (
        React.createElement("div", { className: "flex items-center justify-between p-4 border-b last:border-0 border-gray-100 dark:border-gray-700" },
            React.createElement("div", { className: "flex items-center gap-3" },
                React.createElement("img", { src: user.avatarUrl, className: "w-10 h-10 rounded-full object-cover shadow-sm" }),
                React.createElement("div", null,
                    React.createElement("div", { className: "flex items-center gap-2" },
                        React.createElement("p", { className: "font-bold text-gray-900 dark:text-white" }, user.name),
                        user.role !== 'USER' && React.createElement("span", { className: "px-2 py-0.5 bg-yellow-100 text-yellow-700 text-[10px] font-black rounded border border-yellow-200" }, user.role)
                    ),
                    React.createElement("p", { className: "text-xs text-gray-500" }, user.email)
                )
            ),
            React.createElement("div", { className: "flex items-center gap-3" },
                isSuperAdmin && user.id !== currentUser.id && (
                    React.createElement("select", {
                        value: user.role,
                        onChange: (e) => onRoleChange(user.id, e.target.value),
                        className: "text-xs p-1.5 bg-gray-50 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                    },
                        React.createElement("option", { value: "USER" }, "Usuario"),
                        React.createElement("option", { value: "MODERATOR" }, "Moderador"),
                        React.createElement("option", { value: "SUPER_ADMIN" }, "Super Admin")
                    )
                ),
                user.role !== 'SUPER_ADMIN' && (
                    user.isBanned ? (
                        React.createElement(Button, { size: "sm", variant: "secondary", onClick: () => onUnban(user.id) }, "Reactivar")
                    ) : (
                        // Un moderador normal no puede suspender a otro moderador
                        (currentUser.role === 'SUPER_ADMIN' || !isTargetStaff) && 
                        React.createElement(Button, { size: "sm", variant: "danger", onClick: () => onBan(user.id) }, "Suspender")
                    )
                )
            )
        )
    );
};

const LogItem = ({ log }) => (
    React.createElement("div", { className: "p-4 bg-white dark:bg-gray-800 border-b last:border-0 border-gray-100 dark:border-gray-700 text-sm" },
        React.createElement("div", { className: "flex justify-between items-start mb-1" },
            React.createElement("span", { className: "font-black text-blue-600 dark:text-blue-400 uppercase text-[10px] tracking-widest" }, log.action),
            React.createElement("span", { className: "text-[10px] text-gray-400 font-mono" }, new Date(log.timestamp).toLocaleString())
        ),
        React.createElement("p", { className: "text-gray-900 dark:text-white" }, 
            React.createElement("span", { className: "font-bold" }, log.adminName),
            " actuó sobre ",
            React.createElement("span", { className: "font-mono text-xs bg-gray-100 dark:bg-gray-900 px-1 rounded" }, log.targetId),
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
                isSuperAdmin ? api.getModerationLogs() : Promise.resolve([])
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
        { id: 'logs', label: 'Auditoría Staff', roles: ['SUPER_ADMIN'] }
    ].filter(t => !t.roles || t.roles.includes(currentUser.role));

    return (
        React.createElement("div", { className: "max-w-6xl mx-auto p-4 md:p-8" },
            React.createElement("header", { className: "mb-10" },
                React.createElement("div", { className: "flex items-center gap-3 mb-2" },
                    React.createElement("span", { className: "p-2 bg-yellow-100 text-yellow-700 rounded-lg text-sm font-black" }, "🛡️ STAFF"),
                    React.createElement("h1", { className: "text-4xl font-black text-gray-900 dark:text-white" }, "Centro de Control")
                ),
                React.createElement("p", { className: "text-gray-500" }, "Gestiona la integridad de la comunidad y supervisa la actividad.")
            ),

            React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10" },
                React.createElement(StatsCard, { title: "Swappers", value: stats?.totalUsers, icon: "👤", variant: "blue" }),
                React.createElement(StatsCard, { title: "Artículos", value: stats?.totalItems, icon: "📦", variant: "green" }),
                React.createElement(StatsCard, { title: "Intercambios", value: stats?.totalExchanges, icon: "🤝", variant: "purple" }),
                React.createElement(StatsCard, { title: "Alertas", value: stats?.pendingAlerts, icon: "⚠️", variant: "orange" })
            ),

            React.createElement("div", { className: "flex gap-6 mb-8 border-b dark:border-gray-700 overflow-x-auto no-scrollbar" },
                tabs.map(tab => (
                    React.createElement("button", { 
                        key: tab.id,
                        onClick: () => setActiveTab(tab.id),
                        className: `pb-4 px-2 font-bold whitespace-nowrap transition-all border-b-4 ${activeTab === tab.id ? 'border-blue-500 text-blue-500 scale-105' : 'border-transparent text-gray-400 hover:text-gray-600'}`
                    }, tab.label)
                ))
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
                            React.createElement("div", { key: item.id, className: `bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border-l-8 ${item.isAuto ? 'border-orange-500' : 'border-red-600'} flex flex-col md:row justify-between items-start md:items-center gap-6 animate-fade-in-up hover:shadow-md transition-shadow` },
                                React.createElement("div", { className: "flex-grow" },
                                    React.createElement("div", { className: "flex items-center gap-2 mb-2" },
                                        React.createElement("span", { className: `px-2 py-0.5 rounded text-[10px] font-black uppercase ${item.isAuto ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}` },
                                            item.isAuto ? '🤖 IA DETECT' : '👤 USER REPORT'
                                        ),
                                        React.createElement("span", { className: "text-[10px] text-gray-400 font-bold" }, new Date(item.date).toLocaleString())
                                    ),
                                    React.createElement("h3", { className: "text-xl font-bold mb-1 dark:text-white" }, item.preview),
                                    React.createElement("p", { className: "text-sm text-gray-600 dark:text-gray-400 italic bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg" }, `"${item.reason}"`),
                                    React.createElement("p", { className: "text-xs text-gray-400 mt-2" }, "Informado por: ", React.createElement("span", { className: "font-bold text-gray-600 dark:text-gray-300" }, item.reporterName))
                                ),
                                React.createElement("div", { className: "flex gap-2 w-full md:w-auto" },
                                    React.createElement(Button, { size: "sm", variant: "secondary", onClick: () => handleResolve(item.id, item.type, 'APPROVE') }, "Ignorar"),
                                    React.createElement(Button, { size: "sm", variant: "danger", onClick: () => handleResolve(item.id, item.type, 'DELETE') }, "Eliminar")
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
