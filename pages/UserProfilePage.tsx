import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import ItemCard from '../components/ItemCard.js';
import Spinner from '../components/Spinner.js';
import Button from '../components/Button.js';
import { useAuth } from '../hooks/useAuth.tsx';

const UserProfilePage = () => {
    const { userId } = useParams();
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const queryParams = new URLSearchParams(location.search);
    const fromExchangeId = queryParams.get('fromExchange');
    
    useEffect(() => {
        const fetchProfile = async () => {
            if (!userId) return;
            try {
                setLoading(true);
                const userProfile = await api.getUserProfile(userId);
                setProfile(userProfile);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [userId]);

    const handleCounterOffer = async (itemId) => {
        if (!fromExchangeId) return;
        setIsSubmitting(true);
        try {
            await api.addCounterOffer(fromExchangeId, [itemId]);
            navigate(`/chat/${fromExchangeId}`);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    if (loading) {
        return React.createElement(Spinner, null);
    }

    if (error) {
        return React.createElement("p", { className: "text-red-500" }, "Error: ", error);
    }
    
    if (!profile) {
        return React.createElement("p", null, "Perfil no encontrado.");
    }
    
    return React.createElement("div", null,
        React.createElement("div", { className: "mb-6 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md" },
            React.createElement("h1", { className: "text-3xl font-bold text-gray-900 dark:text-white" }, "Perfil de ", profile.name),
            React.createElement("p", { className: "text-gray-500 dark:text-gray-400" }, `Se unió a Swapit y está listo para intercambiar.`)
        ),
        
        React.createElement("h2", { className: "text-2xl font-bold text-gray-900 dark:text-white mb-4" }, "Artículos disponibles de ", profile.name),

        profile.items.length === 0 ? (
          React.createElement("p", { className: "text-center text-gray-500 dark:text-gray-400 mt-10" },
            `${profile.name} no tiene artículos disponibles en este momento.`
          )
        ) : (
          React.createElement("div", { className: "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" },
            profile.items.map((item) => (
                React.createElement("div", { key: item.id, className: "relative" },
                    React.createElement(ItemCard, { item: item }),
                    fromExchangeId && item.userId !== currentUser.id && (
                        React.createElement(Button, {
                            onClick: () => handleCounterOffer(item.id),
                            isLoading: isSubmitting,
                            className: "w-full mt-2",
                            size: "sm",
                            children: "Contraoferta"
                        })
                    )
                )
            ))
          )
        )
    );
};

export default UserProfilePage;