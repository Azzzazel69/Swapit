
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../services/api.ts';
import Button from '../components/Button.tsx';
import SwapSpinner from '../components/SwapSpinner.tsx';
import { useAuth } from '../hooks/useAuth.tsx';
import { useToast } from '../hooks/useToast.tsx';

const MeetingMapPage = () => {
    const { exchangeId } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();
    const { showToast } = useToast();

    const [exchange, setExchange] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAccepting, setIsAccepting] = useState(false);
    const [smartSuggestions, setSmartSuggestions] = useState(null);
    const [isSearchingSuggestions, setIsSearchingSuggestions] = useState(false);

    const type = searchParams.get('type') || 'midpoint'; 
    const targetUserId = searchParams.get('userId');

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const { exchange: fetchedExchange } = await api.getChatAndExchangeDetails(exchangeId);
                setExchange(fetchedExchange);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [exchangeId]);

    const mapData = useMemo(() => {
        if (!exchange || !exchange.owner || !exchange.requester) return null;
        
        const userA = exchange.owner;
        const userB = exchange.requester;

        let centerLat, centerLng, zoom = 14, title = "", address = "";

        if (type === 'preferred' && targetUserId) {
            const userWithPreference = userA.id === targetUserId ? userA : userB;
            centerLat = userWithPreference.contactCard.meetingPointCoords?.lat;
            centerLng = userWithPreference.contactCard.meetingPointCoords?.lng;
            title = "Ubicación Preferida de " + userWithPreference.name;
            address = userWithPreference.contactCard.meetingPointAddress;
        } else {
            centerLat = (userA.location.lat + userB.location.lat) / 2;
            centerLng = (userA.location.lng + userB.location.lng) / 2;
            title = "Punto Medio Sugerido";
            address = "Zona intermedia entre " + userA.location.city + " y " + userB.location.city;
            zoom = 12;
        }

        return { centerLat, centerLng, zoom, title, address };
    }, [exchange, type, targetUserId]);

    // Obtener sugerencias de Google Maps vía Gemini
    useEffect(() => {
        if (mapData && type === 'midpoint' && !smartSuggestions && !isSearchingSuggestions) {
            setIsSearchingSuggestions(true);
            api.getSmartMeetingSuggestions(mapData.centerLat, mapData.centerLng)
                .then(res => setSmartSuggestions(res))
                .catch(() => {})
                .finally(() => setIsSearchingSuggestions(false));
        }
    }, [mapData, type]);

    const handleAccept = async () => {
        if (!mapData || isAccepting || exchange?.acceptedMeetingPoint) return;
        setIsAccepting(true);
        try {
            await api.acceptMeetingLocation(exchangeId, mapData.address, type.toUpperCase());
            showToast('Ubicación aceptada. Se ha notificado en el chat.', 'success');
            navigate(`/chat/${exchangeId}`);
        } catch (err) {
            showToast('Error al aceptar ubicación', 'error');
        } finally {
            setIsAccepting(false);
        }
    };

    if (loading) return React.createElement("div", { className: "h-full flex items-center justify-center bg-gray-900" }, React.createElement(SwapSpinner, null));
    if (!mapData) return React.createElement("div", { className: "p-10 text-center" }, "Error al cargar datos del mapa.");

    const mapUrl = `https://www.google.com/maps?q=${mapData.centerLat},${mapData.centerLng}&z=${mapData.zoom}&output=embed`;
    const isAlreadyAccepted = !!exchange?.acceptedMeetingPoint;

    return (
        React.createElement("div", { className: "fixed inset-0 bg-gray-900 z-[200] flex flex-col overflow-hidden" },
            React.createElement("div", { className: "p-4 bg-gray-800 border-b border-gray-700 flex items-center justify-between shadow-lg" },
                React.createElement("button", { 
                    onClick: () => navigate(-1),
                    className: "text-white flex items-center gap-2 hover:bg-gray-700 px-3 py-2 rounded-lg transition-colors"
                }, 
                    React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" }, 
                        React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M10 19l-7-7m0 0l7-7m-7 7h18" })
                    ),
                    "Volver"
                ),
                React.createElement("div", { className: "text-center flex-grow px-4" },
                    React.createElement("h2", { className: "text-white font-bold text-lg truncate" }, mapData.title),
                    React.createElement("p", { className: "text-gray-400 text-xs truncate" }, mapData.address)
                ),
                React.createElement("div", { className: "w-24 hidden sm:block" }) 
            ),

            React.createElement("div", { className: "flex-grow relative bg-gray-700 flex flex-col md:flex-row" },
                React.createElement("div", { className: "flex-grow h-full relative" },
                    React.createElement("iframe", {
                        title: "Full Screen Map",
                        width: "100%",
                        height: "100%",
                        frameBorder: "0",
                        style: { border: 0 },
                        src: mapUrl,
                        allowFullScreen: true
                    })
                ),
                
                // Sidebar de Sugerencias de IA (Solo en midpoint)
                type === 'midpoint' && React.createElement("div", { className: "w-full md:w-96 bg-white dark:bg-gray-800 border-t md:border-t-0 md:border-l border-gray-200 dark:border-gray-700 p-6 overflow-y-auto" },
                    React.createElement("div", { className: "flex items-center gap-2 mb-4" },
                        React.createElement("span", { className: "text-2xl" }, "🧠"),
                        React.createElement("h3", { className: "text-lg font-black dark:text-white" }, "Sugerencias de IA")
                    ),
                    
                    isSearchingSuggestions ? (
                        React.createElement("div", { className: "flex flex-col items-center py-10 text-center gap-3" },
                            React.createElement(SwapSpinner, { size: 'md-small' }),
                            React.createElement("p", { className: "text-sm text-gray-500 animate-pulse" }, "Consultando Google Maps para encontrar lugares seguros...")
                        )
                    ) : smartSuggestions ? (
                        React.createElement("div", { className: "space-y-4" },
                            React.createElement("div", { className: "text-sm text-gray-700 dark:text-gray-300 leading-relaxed bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800" }, 
                                smartSuggestions.text
                            ),
                            React.createElement("div", { className: "space-y-2" },
                                React.createElement("p", { className: "text-[10px] font-black uppercase text-gray-400" }, "Ubicaciones Verificadas"),
                                smartSuggestions.sources.map((source, idx) => (
                                    React.createElement("a", { 
                                        key: idx, 
                                        href: source.uri, 
                                        target: "_blank", 
                                        rel: "noopener noreferrer",
                                        className: "flex items-center justify-between p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-500 transition-all group"
                                    },
                                        React.createElement("span", { className: "text-xs font-bold truncate dark:text-white" }, source.title),
                                        React.createElement("span", { className: "text-blue-500 group-hover:translate-x-1 transition-transform" }, "→")
                                    )
                                ))
                            )
                        )
                    ) : null,

                    React.createElement("div", { className: "mt-8 pt-6 border-t border-gray-100 dark:border-gray-700" },
                        isAlreadyAccepted ? (
                            React.createElement("div", { className: "w-full p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-center font-bold text-sm" }, 
                                "✓ Ubicación acordada"
                            )
                        ) : (
                            React.createElement(Button, { 
                                onClick: handleAccept, 
                                isLoading: isAccepting,
                                className: "w-full shadow-lg",
                                children: "Aceptar Punto Medio" 
                            })
                        ),
                        React.createElement("p", { className: "text-[10px] text-gray-400 text-center mt-3" }, "O propón una alternativa en el chat.")
                    )
                )
            )
        )
    );
};

export default MeetingMapPage;
