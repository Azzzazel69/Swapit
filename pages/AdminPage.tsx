
import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api.ts';
import SwapSpinner from '../components/SwapSpinner.tsx';
import Button from '../components/Button.tsx';
import Input from '../components/Input.tsx';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.tsx';
import { ExchangeStatus } from '../types.ts';

const StatCard = ({ title, value, icon, alert, onClick }) => (
    React.createElement("div", { 
        onClick: onClick,
        className: `bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex items-center gap-4 ${alert ? 'border-l-4 border-red-500' : ''} cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors` 
    },
        React.createElement("div", { className: `p-3 rounded-full ${alert ? 'bg-red-100 text-red-500' : 'bg-blue-100 dark:bg-blue-900/50 text-blue-500 dark:text-blue-300'}` },
            icon
        ),
        React.createElement("div", null,
            React.createElement("p", { className: "text-sm text-gray-500 dark:text-gray-400" }, title),
            React.createElement("p", { className: "text-2xl font-bold text-gray-900 dark:text-white" }, value)
        )
    )
);

const ICONS_ADMIN = {
    users: React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" }, React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197M15 21a6 6 0 013.43-5.197" })),
    activeUsers: React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" }, React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M13 10V3L4 14h7v7l9-11h-7z" })),
    items: React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" }, React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 16a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" })),
    exchanges: React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" }, React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" })),
    alert: React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" }, React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" })),
    logs: React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" }, React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" }))
};

const Dashboard = ({ onNavigate }) => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await api.getAdminDashboardStats();
                setStats(data);
            } catch (error) {
                console.error("Error fetching admin stats:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return React.createElement(SwapSpinner, null);
    if (!stats) return React.createElement("p", null, "No se pudieron cargar las estadísticas.");

    return (
        React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6" },
            React.createElement(StatCard, { title: "Alertas de Moderación", value: stats.flaggedItems + stats.flaggedChats, icon: ICONS_ADMIN.alert, alert: true, onClick: () => onNavigate('alerts') }),
            React.createElement(StatCard, { title: "Usuarios Totales", value: stats.totalUsers, icon: ICONS_ADMIN.users, onClick: () => onNavigate('users') }),
            React.createElement(StatCard, { title: "Usuarios Activos", value: stats.activeUsers, icon: ICONS_ADMIN.activeUsers, onClick: () => onNavigate('users') }),
            React.createElement(StatCard, { title: "Artículos Totales", value: stats.totalItems, icon: ICONS_ADMIN.items, onClick: () => onNavigate('items') }),
            React.createElement(StatCard, { title: "Intercambios Activos", value: stats.activeExchanges, icon: ICONS_ADMIN.exchanges, onClick: () => onNavigate('chats') })
        )
    );
};

const ModerationDashboard = () => {
    const [queue, setQueue] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchQueue = async () => {
        setLoading(true);
        try {
            const data = await api.getModerationQueue();
            setQueue(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQueue();
    }, []);

    const handleResolve = async (id, type, action) => {
        if (action === 'DELETE_CHAT') {
            if (!window.confirm("¿Estás seguro de eliminar este chat? Se enviará un aviso a los usuarios.")) return;
        }
        await api.resolveModeration(id, type, action);
        fetchQueue();
    };

    if (loading) return React.createElement(SwapSpinner, null);
    if (queue.length === 0) return React.createElement("div", { className: "text-center p-8 bg-white dark:bg-gray-800 rounded-lg" }, React.createElement("p", { className: "text-green-500 font-semibold" }, "¡Todo limpio! No hay alertas pendientes."));

    return (
        React.createElement("div", { className: "space-y-4" },
            queue.map(item => (
                React.createElement("div", { key: item.id, className: "bg-white dark:bg-gray-800 p-4 rounded-lg shadow border-l-4 border-red-500 flex flex-col md:flex-row justify-between items-start md:items-center gap-4" },
                    React.createElement("div", null,
                        React.createElement("div", { className: "flex items-center gap-2" },
                            React.createElement("span", { className: "px-2 py-0.5 bg-red-100 text-red-800 text-xs font-bold rounded" }, item.type === 'ITEM' ? 'ARTÍCULO' : 'CHAT'),
                            React.createElement("span", { className: "text-gray-500 text-sm" }, new Date(item.date).toLocaleString())
                        ),
                        item.type === 'ITEM' ? (
                            React.createElement(Link, { to: `/item/${item.id}`, className: "font-bold text-lg text-blue-600 hover:underline" }, item.preview)
                        ) : (
                            React.createElement("p", { className: "font-bold text-lg" }, item.preview)
                        ),
                        React.createElement("p", { className: "text-red-600 text-sm" }, "Motivo: ", item.reason)
                    ),
                    React.createElement("div", { className: "flex gap-2" },
                        item.type === 'ITEM' ? (
                            React.createElement(React.Fragment, null,
                                React.createElement(Button, { size: "sm", variant: "secondary", onClick: () => handleResolve(item.id, item.type, 'APPROVE') }, "Ignorar"),
                                React.createElement(Button, { size: "sm", variant: "danger", onClick: () => handleResolve(item.id, item.type, 'DELETE') }, "Eliminar Artículo")
                            )
                        ) : (
                            React.createElement(React.Fragment, null,
                                React.createElement(Button, { size: "sm", variant: "secondary", onClick: () => handleResolve(item.id, item.type, 'DISMISS') }, "Ignorar"),
                                React.createElement(Link, { to: `/chat/${item.id}`, className: "px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 flex items-center" }, "Ver"),
                                React.createElement(Button, { size: "sm", variant: "danger", onClick: () => handleResolve(item.id, item.type, 'DELETE_CHAT') }, "Eliminar Chat")
                            )
                        )
                    )
                )
            ))
        )
    );
};

const UserManagement = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [tab, setTab] = useState('active'); // 'active' or 'banned'

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = await api.getAllUsersForAdmin();
            setUsers(data);
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    const handleBan = async (userId) => {
        if (userId === currentUser.id) return;
        try {
            await api.banUser(userId);
            fetchUsers();
        } catch(err) { alert(err.message); }
    };

    const filteredUsers = useMemo(() => 
        users.filter(user => 
            (user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            user.email.toLowerCase().includes(searchTerm.toLowerCase())) &&
            (tab === 'active' ? !user.isBanned : user.isBanned)
        ), [users, searchTerm, tab]);

    if (loading) return React.createElement(SwapSpinner, null);

    return (
        React.createElement("div", null,
            React.createElement("div", { className: "flex gap-4 mb-4 border-b dark:border-gray-700" },
                React.createElement("button", { 
                    className: `py-2 px-4 border-b-2 font-medium text-sm ${tab === 'active' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'}`,
                    onClick: () => setTab('active')
                }, "Usuarios Activos"),
                React.createElement("button", { 
                    className: `py-2 px-4 border-b-2 font-medium text-sm ${tab === 'banned' ? 'border-red-500 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'}`,
                    onClick: () => setTab('banned')
                }, "Usuarios Baneados")
            ),
            React.createElement(Input, { id: "user-search", placeholder: "Buscar por nombre o email...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: "mb-4" }),
            React.createElement("div", { className: "overflow-x-auto" },
                React.createElement("table", { className: "min-w-full bg-white dark:bg-gray-800 text-sm" },
                    React.createElement("thead", null, React.createElement("tr", { className: "bg-gray-50 dark:bg-gray-700" },
                        React.createElement("th", { className: "px-4 py-2 text-left font-semibold text-gray-600 dark:text-gray-300" }, "Nombre"),
                        React.createElement("th", { className: "px-4 py-2 text-left font-semibold text-gray-600 dark:text-gray-300" }, "Email"),
                        React.createElement("th", { className: "px-4 py-2 text-left font-semibold text-gray-600 dark:text-gray-300" }, "Teléfono"),
                        React.createElement("th", { className: "px-4 py-2 text-left font-semibold text-gray-600 dark:text-gray-300" }, "Acciones")
                    )),
                    React.createElement("tbody", null, filteredUsers.map(user => 
                        React.createElement("tr", { key: user.id, className: "border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50" },
                            React.createElement("td", { className: "px-4 py-2" }, user.name),
                            React.createElement("td", { className: "px-4 py-2" }, user.email),
                            React.createElement("td", { className: "px-4 py-2 text-gray-500" }, user.phone || '-'),
                            React.createElement("td", { className: "px-4 py-2" },
                                React.createElement(Button, { 
                                    variant: user.isBanned ? "primary" : "danger", 
                                    size: "sm", 
                                    onClick: () => handleBan(user.id), 
                                    disabled: user.id === currentUser.id 
                                }, user.isBanned ? "Desbanear" : "Banear")
                            )
                        )
                    ))
                )
            ),
            filteredUsers.length === 0 && React.createElement("p", { className: "text-center text-gray-500 mt-4" }, "No se encontraron usuarios.")
        )
    );
};

const AuditLogDashboard = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const data = await api.getAdminAuditLogs({ query: searchTerm, page, limit: 20 });
            setLogs(data.logs);
            setTotalPages(data.totalPages);
        } catch (error) {
            console.error("Error logs", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => { setPage(1); fetchLogs(); }, 500);
        return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchTerm]);

    useEffect(() => { fetchLogs(); }, [page]);

    const renderDiff = (changes) => {
        if (!changes || changes.length === 0) return null;
        return changes.map((change, idx) => (
            React.createElement("div", { key: idx, className: "text-xs text-gray-600 dark:text-gray-400 mt-1" },
                React.createElement("span", { className: "font-semibold capitalize" }, change.field),
                ": ",
                React.createElement("span", { className: "line-through text-red-400 mr-2" }, change.old || "n/a"),
                React.createElement("span", { className: "text-green-600 font-medium" }, change.new)
            )
        ));
    };

    const getActionBadge = (action) => {
        const styles = {
            CREATE: 'bg-green-100 text-green-800',
            UPDATE: 'bg-blue-100 text-blue-800',
            DELETE: 'bg-red-100 text-red-800'
        };
        const labels = { CREATE: 'CREADO', UPDATE: 'EDITADO', DELETE: 'ELIMINADO' };
        return React.createElement("span", { className: `px-2 py-1 rounded text-xs font-bold ${styles[action] || 'bg-gray-100'}` }, labels[action] || action);
    };

    return (
        React.createElement("div", null,
            React.createElement(Input, { id: "log-search", placeholder: "Buscar por usuario, título o ID...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: "mb-4" }),
            loading ? React.createElement(SwapSpinner, null) : (
                React.createElement("div", { className: "space-y-3" },
                    logs.map(log => (
                        React.createElement("div", { key: log.id, className: "bg-white dark:bg-gray-800 p-4 rounded border-l-4 border-gray-300 dark:border-gray-600 hover:shadow-md" },
                            React.createElement("div", { className: "flex justify-between items-start" },
                                React.createElement("div", null,
                                    React.createElement("div", { className: "flex items-center gap-2 mb-1" },
                                        getActionBadge(log.action),
                                        React.createElement("span", { className: "text-sm text-gray-500" }, new Date(log.timestamp).toLocaleString())
                                    ),
                                    React.createElement("p", { className: "font-medium text-gray-900 dark:text-white" },
                                        React.createElement("span", { className: "text-blue-600 dark:text-blue-400 font-bold" }, log.actorName),
                                        " modificó el artículo: ",
                                        React.createElement(Link, { to: `/item/${log.itemId}`, className: "hover:underline" }, log.itemTitle)
                                    )
                                ),
                                React.createElement("span", { className: "text-xs text-gray-400" }, `ID: ${log.id}`)
                            ),
                            React.createElement("div", { className: "mt-2 pl-4 border-l-2 border-gray-200 dark:border-gray-700" },
                                log.changes ? renderDiff(log.changes) : React.createElement("span", { className: "text-xs italic text-gray-400" }, "Sin detalles de cambios")
                            )
                        )
                    ))
                )
            ),
            logs.length === 0 && !loading && React.createElement("p", { className: "text-center text-gray-500 mt-4" }, "No hay registros de auditoría."),
            totalPages > 1 && (
                React.createElement("div", { className: "flex justify-center items-center gap-4 mt-4" },
                    React.createElement(Button, { disabled: page === 1, onClick: () => setPage(p => p - 1), size: "sm", variant: "secondary", children: "<" }),
                    React.createElement("span", { className: "text-sm" }, `${page} / ${totalPages}`),
                    React.createElement(Button, { disabled: page === totalPages, onClick: () => setPage(p => p + 1), size: "sm", variant: "secondary", children: ">" })
                )
            )
        )
    );
};

const ItemManagement = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchItems = async () => {
        setLoading(true);
        try {
            const data = await api.getAllItemsForAdmin();
            setItems(data);
        } catch (error) {
            console.error("Error fetching items:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchItems(); }, []);

    const handleDelete = async (itemId) => {
        if (window.confirm("¿Eliminar artículo irreversiblemente?")) {
            try {
                await api.deleteItemByAdmin(itemId);
                fetchItems();
            } catch (error) {
                alert(error.message);
            }
        }
    };

    const filteredItems = useMemo(() => 
        items.filter(item => 
            item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.ownerName.toLowerCase().includes(searchTerm.toLowerCase())
        ), [items, searchTerm]);

    if (loading) return React.createElement(SwapSpinner, null);

    return (
        React.createElement("div", null,
            React.createElement(Input, { id: "item-search", placeholder: "Buscar por título o propietario...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: "mb-4" }),
            React.createElement("div", { className: "overflow-x-auto" },
                React.createElement("table", { className: "min-w-full bg-white dark:bg-gray-800 text-sm" },
                    React.createElement("thead", null, React.createElement("tr", { className: "bg-gray-50 dark:bg-gray-700" },
                        React.createElement("th", { className: "px-4 py-2 text-left font-semibold" }, "Título (Link)"),
                        React.createElement("th", { className: "px-4 py-2 text-left font-semibold" }, "Propietario"),
                        React.createElement("th", { className: "px-4 py-2 text-left font-semibold" }, "Publicado"),
                        React.createElement("th", { className: "px-4 py-2 text-left font-semibold" }, "Modificado"),
                        React.createElement("th", { className: "px-4 py-2 text-left font-semibold" }, "Acciones")
                    )),
                    React.createElement("tbody", null, filteredItems.map(item => 
                        React.createElement("tr", { key: item.id, className: `border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 ${item.flagged ? 'bg-red-50 dark:bg-red-900/20' : ''}` },
                            React.createElement("td", { className: "px-4 py-2" },
                                React.createElement(Link, { to: `/item/${item.id}`, className: "text-blue-600 hover:underline font-medium" }, item.title),
                                item.flagged && React.createElement("span", { className: "ml-2 text-xs bg-red-500 text-white px-1 rounded" }, "REPORTADO")
                            ),
                            React.createElement("td", { className: "px-4 py-2" }, item.ownerName),
                            React.createElement("td", { className: "px-4 py-2 text-gray-500" }, new Date(item.createdAt).toLocaleDateString()),
                            React.createElement("td", { className: "px-4 py-2 text-xs text-gray-500" },
                                React.createElement("div", null, `Editado: ${item.modificationCount || 0} veces`),
                                React.createElement("div", null, item.lastModifiedAt ? new Date(item.lastModifiedAt).toLocaleDateString() : '-')
                            ),
                            React.createElement("td", { className: "px-4 py-2" },
                                React.createElement(Button, { variant: "danger", size: "sm", onClick: () => handleDelete(item.id), children: "Eliminar" })
                            )
                        )
                    ))
                )
            )
        )
    );
};

const ChatModeration = () => {
    const [exchanges, setExchanges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const navigate = useNavigate();

    const fetchExchanges = async () => {
        setLoading(true);
        try {
            const data = await api.adminAdvancedSearchExchanges({
                query: searchTerm,
                status: 'ALL',
                page,
                limit: 25 // Higher limit for compact view
            });
            setExchanges(data.exchanges);
            setTotalPages(data.totalPages);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => { setPage(1); fetchExchanges(); }, 500);
        return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchTerm]);

    useEffect(() => { fetchExchanges(); }, [page]);

    return (
        React.createElement("div", { className: "space-y-4" },
            React.createElement("div", { className: "bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm" },
                React.createElement(Input, { 
                    id: "chat-search", 
                    placeholder: "Buscar mensajes o @usuario...", 
                    value: searchTerm, 
                    onChange: (e) => setSearchTerm(e.target.value),
                    className: "w-full"
                })
            ),

            loading ? React.createElement(SwapSpinner, null) : (
                React.createElement("div", { className: "bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden" },
                    exchanges.map((ex, idx) => (
                        React.createElement("div", { 
                            key: ex.id, 
                            className: `flex items-center justify-between p-2 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-sm ${ex.flagged ? 'bg-red-50 dark:bg-red-900/20' : ''} cursor-pointer`,
                            onClick: () => navigate(`/chat/${ex.id}`)
                        },
                            React.createElement("div", { className: "flex-1 min-w-0 grid grid-cols-12 gap-2 items-center" },
                                React.createElement("div", { className: "col-span-3 truncate font-medium text-blue-600 dark:text-blue-400" }, ex.requesterName),
                                React.createElement("div", { className: "col-span-1 text-center text-gray-400" }, "⇄"),
                                React.createElement("div", { className: "col-span-3 truncate font-medium text-blue-600 dark:text-blue-400" }, ex.ownerName),
                                React.createElement("div", { className: "col-span-4 truncate text-gray-500" }, 
                                    ex.flagged ? React.createElement("span", { className: "text-red-500 font-bold" }, "⚠ REPORTADO ") : '',
                                    ex.matchSnippet ? `"${ex.matchSnippet}"` : `Item: ${ex.requestedItemTitle}`
                                ),
                                React.createElement("div", { className: "col-span-1 text-right text-xs text-gray-400" }, new Date(ex.lastMessageDate).toLocaleDateString())
                            ),
                            React.createElement("div", { className: "ml-2 text-gray-400" }, "›")
                        )
                    ))
                )
            ),
             // Pagination Controls
             totalPages > 1 && (
                React.createElement("div", { className: "flex justify-center items-center gap-4 mt-4" },
                    React.createElement(Button, { disabled: page === 1, onClick: () => setPage(p => p - 1), size: "sm", variant: "secondary", children: "<" }),
                    React.createElement("span", { className: "text-sm" }, `${page} / ${totalPages}`),
                    React.createElement(Button, { disabled: page === totalPages, onClick: () => setPage(p => p + 1), size: "sm", variant: "secondary", children: ">" })
                )
            )
        )
    );
};

const AdminPage = () => {
    const [activeTab, setActiveTab] = useState('alerts');

    const tabs = [
        { id: 'alerts', label: '🚨 Alertas' },
        { id: 'dashboard', label: 'Dashboard' },
        { id: 'users', label: 'Usuarios' },
        { id: 'items', label: 'Artículos' },
        { id: 'chats', label: 'Chats' },
        { id: 'logs', label: '📜 Historial' } // New Tab
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'alerts': return React.createElement(ModerationDashboard, null);
            case 'dashboard': return React.createElement(Dashboard, { onNavigate: setActiveTab });
            case 'users': return React.createElement(UserManagement, null);
            case 'items': return React.createElement(ItemManagement, null);
            case 'chats': return React.createElement(ChatModeration, null);
            case 'logs': return React.createElement(AuditLogDashboard, null); // New Component
            default: return null;
        }
    };

    return (
        React.createElement("div", { className: "max-w-7xl mx-auto" },
            React.createElement("h1", { className: "text-3xl font-bold mb-6" }, "Panel de Administración"),
            React.createElement("div", { className: "border-b border-gray-200 dark:border-gray-700 mb-6 overflow-x-auto" },
                React.createElement("nav", { className: "-mb-px flex space-x-8", "aria-label": "Tabs" },
                    tabs.map(tab => (
                        React.createElement("button", {
                            key: tab.id,
                            onClick: () => setActiveTab(tab.id),
                            className: `${
                                activeTab === tab.id
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`
                        }, tab.label)
                    ))
                )
            ),
            React.createElement("div", { className: "bg-gray-50 dark:bg-gray-900/50 p-6 rounded-lg" },
                renderContent()
            )
        )
    );
};

export default AdminPage;
