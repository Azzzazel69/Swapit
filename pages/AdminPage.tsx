
import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api.ts';
import SwapSpinner from '../components/SwapSpinner.tsx';
import Button from '../components/Button.tsx';
import Input from '../components/Input.tsx';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.tsx';

const StatCard = ({ title, value, icon }) => (
    React.createElement("div", { className: "bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex items-center gap-4" },
        React.createElement("div", { className: "p-3 bg-blue-100 dark:bg-blue-900/50 rounded-full text-blue-500 dark:text-blue-300" },
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
    items: React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" }, React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" })),
    exchanges: React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" }, React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" })),
};

const Dashboard = () => {
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
        React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6" },
            React.createElement(StatCard, { title: "Usuarios Totales", value: stats.totalUsers, icon: ICONS_ADMIN.users }),
            React.createElement(StatCard, { title: "Artículos Totales", value: stats.totalItems, icon: ICONS_ADMIN.items }),
            React.createElement(StatCard, { title: "Intercambios Activos", value: stats.activeExchanges, icon: ICONS_ADMIN.exchanges })
        )
    );
};

const UserManagement = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

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

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleDelete = async (userId) => {
        if (userId === currentUser.id) {
            alert("No puedes eliminar tu propia cuenta de administrador.");
            return;
        }
        if (window.confirm("¿Seguro que quieres eliminar este usuario? Esta acción es irreversible y eliminará también sus artículos e intercambios.")) {
            try {
                await api.deleteUserByAdmin(userId);
                fetchUsers();
            } catch (error) {
                alert("Error al eliminar el usuario: " + error.message);
            }
        }
    };

    const filteredUsers = useMemo(() => 
        users.filter(user => 
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            user.email.toLowerCase().includes(searchTerm.toLowerCase())
        ), [users, searchTerm]);

    if (loading) return React.createElement(SwapSpinner, null);

    return (
        React.createElement("div", null,
            React.createElement(Input, { id: "user-search", placeholder: "Buscar por nombre o email...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: "mb-4" }),
            React.createElement("div", { className: "overflow-x-auto" },
                React.createElement("table", { className: "min-w-full bg-white dark:bg-gray-800" },
                    React.createElement("thead", null, React.createElement("tr", null,
                        React.createElement("th", { className: "px-6 py-3 border-b-2 border-gray-300 dark:border-gray-700 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider" }, "Nombre"),
                        React.createElement("th", { className: "px-6 py-3 border-b-2 border-gray-300 dark:border-gray-700 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider" }, "Email"),
                        React.createElement("th", { className: "px-6 py-3 border-b-2 border-gray-300 dark:border-gray-700 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider" }, "Rol"),
                        React.createElement("th", { className: "px-6 py-3 border-b-2 border-gray-300 dark:border-gray-700 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider" }, "Acciones")
                    )),
                    React.createElement("tbody", null, filteredUsers.map(user => 
                        React.createElement("tr", { key: user.id },
                            React.createElement("td", { className: "px-6 py-4 whitespace-nowrap border-b border-gray-200 dark:border-gray-700" }, user.name),
                            React.createElement("td", { className: "px-6 py-4 whitespace-nowrap border-b border-gray-200 dark:border-gray-700" }, user.email),
                            React.createElement("td", { className: "px-6 py-4 whitespace-nowrap border-b border-gray-200 dark:border-gray-700" }, React.createElement("span", { className: `px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'SUPER_ADMIN' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}` }, user.role)),
                            React.createElement("td", { className: "px-6 py-4 whitespace-nowrap border-b border-gray-200 dark:border-gray-700" },
                                React.createElement(Button, { variant: "danger", size: "sm", onClick: () => handleDelete(user.id), disabled: user.id === currentUser.id, children: "Eliminar" })
                            )
                        )
                    ))
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

    useEffect(() => {
        fetchItems();
    }, []);

    const handleDelete = async (itemId) => {
        if (window.confirm("¿Seguro que quieres eliminar este artículo? Esta acción es irreversible.")) {
            try {
                await api.deleteItemByAdmin(itemId);
                fetchItems();
            } catch (error) {
                alert("Error al eliminar el artículo: " + error.message);
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
                React.createElement("table", { className: "min-w-full bg-white dark:bg-gray-800" },
                    React.createElement("thead", null, React.createElement("tr", null,
                        React.createElement("th", { className: "px-6 py-3 border-b-2 border-gray-300 dark:border-gray-700 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider" }, "Título"),
                        React.createElement("th", { className: "px-6 py-3 border-b-2 border-gray-300 dark:border-gray-700 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider" }, "Propietario"),
                        React.createElement("th", { className: "px-6 py-3 border-b-2 border-gray-300 dark:border-gray-700 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider" }, "Estado"),
                        React.createElement("th", { className: "px-6 py-3 border-b-2 border-gray-300 dark:border-gray-700 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider" }, "Acciones")
                    )),
                    React.createElement("tbody", null, filteredItems.map(item => 
                        React.createElement("tr", { key: item.id },
                            React.createElement("td", { className: "px-6 py-4 whitespace-nowrap border-b border-gray-200 dark:border-gray-700" }, item.title),
                            React.createElement("td", { className: "px-6 py-4 whitespace-nowrap border-b border-gray-200 dark:border-gray-700" }, item.ownerName),
                            React.createElement("td", { className: "px-6 py-4 whitespace-nowrap border-b border-gray-200 dark:border-gray-700" }, item.status),
                            React.createElement("td", { className: "px-6 py-4 whitespace-nowrap border-b border-gray-200 dark:border-gray-700" },
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
    const navigate = useNavigate();

    useEffect(() => {
        const fetchExchanges = async () => {
            setLoading(true);
            try {
                const data = await api.getAllExchangesForAdmin();
                setExchanges(data);
            } catch (error) {
                console.error("Error fetching exchanges:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchExchanges();
    }, []);

    if (loading) return React.createElement(SwapSpinner, null);

    return (
        React.createElement("div", { className: "space-y-4" },
            exchanges.map(ex => (
                React.createElement("div", { key: ex.id, className: "bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm flex justify-between items-center" },
                    React.createElement("div", null,
                        React.createElement("p", { className: "font-semibold" }, "Chat entre ", ex.requesterName, " y ", ex.ownerName),
                        React.createElement("p", { className: "text-sm text-gray-500" }, `Sobre: ${ex.requestedItemTitle}`),
                        React.createElement("p", { className: "text-xs text-gray-400" }, "Estado: ", ex.status)
                    ),
                    React.createElement(Button, { size: "sm", onClick: () => navigate(`/chat/${ex.id}`), children: "Ver Chat" })
                )
            ))
        )
    );
};


const AdminPage = () => {
    const [activeTab, setActiveTab] = useState('dashboard');

    const tabs = [
        { id: 'dashboard', label: 'Dashboard' },
        { id: 'users', label: 'Usuarios' },
        { id: 'items', label: 'Artículos' },
        { id: 'chats', label: 'Chats' }
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard': return React.createElement(Dashboard, null);
            case 'users': return React.createElement(UserManagement, null);
            case 'items': return React.createElement(ItemManagement, null);
            case 'chats': return React.createElement(ChatModeration, null);
            default: return null;
        }
    };

    return (
        React.createElement("div", { className: "max-w-6xl mx-auto" },
            React.createElement("h1", { className: "text-3xl font-bold mb-6" }, "Panel de Administración"),
            React.createElement("div", { className: "border-b border-gray-200 dark:border-gray-700 mb-6" },
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
