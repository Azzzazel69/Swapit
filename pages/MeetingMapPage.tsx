
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

    const type = searchParams.get('type') || 'midpoint'; // 'midpoint' or 'preferred'
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
        if (!exchange) return null;
        
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
            // Midpoint calculation based on real location
            centerLat = (userA.location.lat + userB.location.lat) / 2;
            centerLng = (userA.location.lng + userB.location.lng) / 2;
            title = "Punto Medio Sugerido";
            address = "Zona intermedia entre " + userA.location.city + " y " + userB.location.city;
            zoom = 12;
        }

        return { centerLat, centerLng, zoom, title, address };
    }, [exchange, type, targetUserId]);

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
            // Header for Full Screen
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
                React.createElement("div", { className: "w-24 hidden sm:block" }) // Spacer
            ),

            // Map Area
            React.createElement("div", { className: "flex-grow relative bg-gray-700" },
                React.createElement("iframe", {
                    title: "Full Screen Map",
                    width: "100%",
                    height: "100%",
                    frameBorder: "0",
                    style: { border: 0 },
                    src: mapUrl,
                    allowFullScreen: true
                }),
                
                // Floating Overlay Info (Mobile style)
                React.createElement("div", { className: "absolute bottom-10 left-4 right-4 md:left-auto md:right-10 md:w-96 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 animate-fade-in-up" },
                    React.createElement("h3", { className: "text-lg font-bold mb-1" }, mapData.title),
                    React.createElement("p", { className: "text-sm text-gray-500 mb-6" }, 
                        isAlreadyAccepted 
                            ? `Ya habéis acordado encontraros en: ${exchange.acceptedMeetingPoint}.`
                            : type === 'midpoint' 
                                ? "Hemos calculado un punto intermedio equitativo basado en vuestras ciudades registradas." 
                                : "Esta es la ubicación preferida indicada por el otro usuario."
                    ),
                    React.createElement("div", { className: "flex gap-3" },
                        isAlreadyAccepted ? (
                            React.createElement("div", { className: "w-full p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-center font-bold text-sm" }, 
                                "✓ Ubicación acordada"
                            )
                        ) : (
                            React.createElement(Button, { 
                                onClick: handleAccept, 
                                isLoading: isAccepting,
                                className: "flex-grow",
                                children: "Aceptar esta Ubicación" 
                            })
                        )
                    )
                )
            )
        )
    );
};

export default MeetingMapPage;
