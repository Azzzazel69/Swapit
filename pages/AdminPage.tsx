
import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import SwapSpinner from '../components/SwapSpinner.tsx';
import Button from '../components/Button.tsx';
import Input from '../components/Input.tsx';
import { useToast } from '../hooks/useToast.tsx';

const FilterManager = () => {
    const [filters, setFilters] = useState({});
    const [loading, setLoading] = useState(true);
    const [newWord, setNewWord] = useState('');
    const [activeCat, setActiveCat] = useState('HARASSMENT');
    const { showToast } = useToast();

    const fetchFilters = async () => {
        try {
            const data = await api.getModerationFilters();
            setFilters(data);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchFilters(); }, []);

    const handleAdd = async () => {
        if (!newWord.trim()) return;
        await api.addFilterWord(activeCat, newWord.trim());
        setNewWord('');
        fetchFilters();
        showToast(`"${newWord}" añadida al filtro.`, 'success');
    };

    const handleRemove = async (cat, word) => {
        await api.removeFilterWord(cat, word);
        fetchFilters();
        showToast('Palabra eliminada.', 'success');
    };

    if (loading) return React.createElement(SwapSpinner, { size: "lg" });

    const categories = [
        { id: 'HARASSMENT', label: '🤬 Acoso e Insultos', color: 'red' },
        { id: 'DRUGS_SLANG', label: '🌿 Drogas y Slang', color: 'green' },
        { id: 'ILLEGAL_ITEMS', label: '🔫 Objetos Ilegales', color: 'orange' }
    ];

    return (
        React.createElement("div", { className: "bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700" },
            React.createElement("h2", { className: "text-2xl font-bold mb-6" }, "Gestión de Filtros de Contenido"),
            
            React.createElement("div", { className: "flex flex-wrap gap-2 mb-8" },
                categories.map(cat => (
                    React.createElement("button", {
                        key: cat.id,
                        onClick: () => setActiveCat(cat.id),
                        className: `px-4 py-2 rounded-full text-sm font-bold transition-all ${activeCat === cat.id ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`
                    }, cat.label)
                ))
            ),

            React.createElement("div", { className: "flex gap-2 mb-6" },
                React.createElement(Input, {
                    id: "new-filter-word",
                    placeholder: "Añadir palabra...",
                    value: newWord,
                    onChange: e => setNewWord(e.target.value),
                    className: "flex-grow"
                }),
                React.createElement(Button, { onClick: handleAdd, children: "Añadir" })
            ),

            React.createElement("div", { className: "flex flex-wrap gap-2" },
                filters[activeCat]?.map(word => (
                    React.createElement("div", { key: word, className: "flex items-center gap-2 bg-gray-50 dark:bg-gray-900 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 group hover:border-red-400 transition-colors" },
                        React.createElement("span", { className: "text-sm font-medium" }, word),
                        React.createElement("button", { 
                            onClick: () => handleRemove(activeCat, word),
                            className: "text-gray-400 hover:text-red-500 font-bold px-1"
                        }, "×")
                    )
                ))
            )
        )
    );
};

const AdminPage = () => {
    const [queue, setQueue] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('alerts');

    const fetchQueue = async () => {
        setLoading(true);
        try {
            const data = await api.getModerationQueue();
            setQueue(data);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchQueue(); }, []);

    const handleResolve = async (alertId, type, action) => {
        await api.resolveModeration(alertId, type, action);
        fetchQueue();
    };

    if (loading) return React.createElement("div", { className: "flex justify-center p-20" }, React.createElement(SwapSpinner, { size: "lg" }));

    return (
        React.createElement("div", { className: "max-w-6xl mx-auto p-4 md:p-8" },
            React.createElement("header", { className: "mb-8" },
                React.createElement("h1", { className: "text-4xl font-black text-gray-900 dark:text-white" }, "Centro de Control Admin"),
                React.createElement("p", { className: "text-gray-500" }, "Panel de moderación y configuración de Swapit.")
            ),

            React.createElement("div", { className: "flex gap-6 mb-8 border-b dark:border-gray-700" },
                React.createElement("button", { 
                    onClick: () => setActiveTab('alerts'),
                    className: `pb-4 px-2 font-bold transition-all ${activeTab === 'alerts' ? 'border-b-4 border-blue-500 text-blue-500' : 'text-gray-400'}`
                }, `Alertas (${queue.length})`),
                React.createElement("button", { 
                    onClick: () => setActiveTab('filters'),
                    className: `pb-4 px-2 font-bold transition-all ${activeTab === 'filters' ? 'border-b-4 border-blue-500 text-blue-500' : 'text-gray-400'}`
                }, "Gestión de Filtros")
            ),

            activeTab === 'filters' ? React.createElement(FilterManager, null) : (
                React.createElement("div", { className: "space-y-4" },
                    queue.length === 0 ? (
                        React.createElement("div", { className: "text-center py-20 bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700" },
                            React.createElement("span", { className: "text-5xl mb-4 block" }, "✅"),
                            React.createElement("h3", { className: "text-xl font-bold" }, "Comunidad Limpia"),
                            React.createElement("p", { className: "text-gray-500" }, "No hay contenido pendiente de revisión.")
                        )
                    ) : (
                        queue.map(item => (
                            React.createElement("div", { key: item.id, className: `bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border-l-8 ${item.isAuto ? 'border-orange-500' : 'border-red-600'} flex flex-col md:flex-row justify-between items-start md:items-center gap-6 animate-fade-in-up` },
                                React.createElement("div", { className: "flex-grow" },
                                    React.createElement("div", { className: "flex items-center gap-2 mb-2" },
                                        React.createElement("span", { className: `px-2 py-0.5 rounded text-[10px] font-black uppercase ${item.isAuto ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}` },
                                            item.isAuto ? '🤖 AUTO-DETECCIÓN' : '👤 REPORTE USUARIO'
                                        ),
                                        React.createElement("span", { className: "text-xs text-gray-400" }, new Date(item.date).toLocaleString())
                                    ),
                                    React.createElement("h3", { className: "text-xl font-bold mb-1" }, item.preview),
                                    React.createElement("p", { className: "text-sm text-gray-600 dark:text-gray-400 italic" }, `"${item.reason}"`),
                                    React.createElement("p", { className: "text-xs text-gray-400 mt-2" }, "Autor: ", React.createElement("span", { className: "font-bold" }, item.reporterName))
                                ),
                                React.createElement("div", { className: "flex gap-2 w-full md:w-auto" },
                                    React.createElement(Button, { size: "sm", variant: "secondary", onClick: () => handleResolve(item.id, item.type, 'APPROVE'), children: "Ignorar" }),
                                    React.createElement(Button, { size: "sm", variant: "danger", onClick: () => handleResolve(item.id, item.type, 'DELETE'), children: "Eliminar" })
                                )
                            )
                        ))
                    )
                )
            )
        )
    );
};

export default AdminPage;
