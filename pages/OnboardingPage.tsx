

import React, { useState, useEffect, useMemo } from 'react';
// FIX: Changed import from useAuth.js to useAuth.tsx
import { useAuth } from '../hooks/useAuth.tsx';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api.ts';
import Button from '../components/Button.tsx';
import Input from '../components/Input.tsx';
import SwapSpinner from '../components/SwapSpinner.tsx';
import { CATEGORIES_WITH_SUBCATEGORIES, ICONS } from '../constants.tsx';
import { useColorTheme } from '../hooks/useColorTheme.tsx';
import AutocompleteInput from '../components/AutocompleteInput.tsx';
import { locations } from '../data/locations.ts';
import { requestNotificationPermission } from '../services/pushNotifications.ts';
import TutorialModal from '../components/TutorialModal.tsx';

const OnboardingPage = () => {
    const { user, refreshUser } = useAuth();
    const { theme } = useColorTheme();
    const navigate = useNavigate();
    const [step, setStep] = useState('initial_check');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    
    // Phone state
    const [phone, setPhone] = useState('');
    const [code, setCode] = useState('');
    const [codeSent, setCodeSent] = useState(false);

    // Location state
    const [country, setCountry] = useState('');
    const [city, setCity] = useState('');
    const [postalCode, setPostalCode] = useState('');
    const [address, setAddress] = useState('');
    const [isLocating, setIsLocating] = useState(false);

    // Preferences state
    const [preferences, setPreferences] = useState([]);
    
    const determineOnboardingStep = () => {
        if (!user) return;
        if (user.emailVerified && user.phoneVerified && user.location && user.preferences?.length > 0) {
            setStep('complete');
            setTimeout(() => navigate('/'), 2000);
        } else if (!user.emailVerified) {
            setStep('email');
        } else if (!user.phoneVerified) {
            setStep('phone');
        } else if (!user.location) {
            setStep('location');
        } else {
            setStep('preferences');
        }
    };

    useEffect(() => {
        if (user) {
            const tutorialCompleted = typeof window !== 'undefined' ? window.localStorage.getItem('tutorial_completed') === 'true' : true;
            if (!tutorialCompleted) {
                setStep('tutorial');
            } else {
                determineOnboardingStep();
            }
        }
    }, [user, navigate]);

    const handleTutorialClose = () => {
        if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem('tutorial_completed', 'true');
        }
        determineOnboardingStep();
    };

    const handleVerifyEmail = async () => {
        setIsLoading(true); setError('');
        try {
            await api.verifyEmail();
            await refreshUser();
        } catch (err) { setError(err.message); } 
        finally { setIsLoading(false); }
    };

    const handleSendCode = async (e) => {
        e.preventDefault();
        setIsLoading(true); setError('');
        try {
            await api.sendPhoneVerificationCode(phone);
            setCodeSent(true);
        } catch (err) { setError(err.message); } 
        finally { setIsLoading(false); }
    };

    const handleVerifyCode = async (e) => {
        e.preventDefault();
        setIsLoading(true); setError('');
        try {
            const success = await api.verifyPhoneCode(code);
            if (success) {
                await refreshUser();
            } else {
                setError('Código de verificación incorrecto.');
            }
        } catch (err) { setError(err.message); } 
        finally { setIsLoading(false); }
    };

    const handleAutoDetectLocation = () => {
        setIsLocating(true); setError('');
        navigator.geolocation.getCurrentPosition(
            (position) => {
                // Mocked response for demo
                setCountry("España");
                setCity("Madrid");
                setPostalCode("28013");
                setAddress("Plaza Mayor, 1");
                setIsLocating(false);
            },
            (error) => {
                setError("No se pudo obtener la ubicación. Por favor, introdúcela manualmente.");
                setIsLocating(false);
            }
        );
    };

    useEffect(() => {
        if (step === 'location' && !country && !city && !postalCode) {
            handleAutoDetectLocation();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step]);
    
    const handleCountryChange = (selectedCountry) => {
        setCountry(selectedCountry);
        setCity(''); // Reset city when country changes
        setError(''); // Clear error on country change
    };

    const countries = useMemo(() => Object.keys(locations), []);
    const citiesForSelectedCountry = useMemo(() => {
        return country && locations[country] ? locations[country] : [];
    }, [country]);


    const handleSaveLocation = async (e) => {
        e.preventDefault();
        if (country !== 'España') {
            setError('Lo sentimos, Swapit de momento solo está disponible en España.');
            return;
        }
        setIsLoading(true); setError('');
        try {
            await api.updateUserLocation({ country, city, postalCode, address });
            await refreshUser(); // Refresh user to get location data
        } catch (err) { setError(err.message); } 
        finally { setIsLoading(false); }
    };
    
    const handlePreferenceChange = (category) => {
        setPreferences(prev => 
            prev.includes(category) 
                ? prev.filter(p => p !== category) 
                : [...prev, category]
        );
    };

    const handleSavePreferences = async () => {
        setIsLoading(true); setError('');
        try {
            await api.updateUserPreferences(preferences);
            await requestNotificationPermission();
            await refreshUser();
        } catch (err) { setError(err.message); }
        finally { setIsLoading(false); }
    };

    const renderStepContent = () => {
        switch(step) {
            case 'initial_check':
            case 'tutorial':
                return React.createElement(SwapSpinner, null);
            case 'email':
                return React.createElement("div", null,
                    React.createElement("h3", { className: "text-xl font-semibold mb-2" }, "Paso 1: Verifica tu Correo"),
                    React.createElement("p", { className: "mb-4 text-gray-600 dark:text-gray-400" }, "Se ha enviado un enlace de verificación a ", React.createElement("strong", null, user?.email), ". (Para esta demo, solo haz clic en el botón de abajo)."),
                    React.createElement(Button, { onClick: handleVerifyEmail, isLoading: isLoading, children: "Confirmar Correo Electrónico" })
                );
            case 'phone':
                 return React.createElement("div", null,
                    React.createElement("h3", { className: "text-xl font-semibold mb-2" }, "Paso 2: Asegura tu Cuenta (2FA)"),
                    React.createElement("p", { className: "mb-4 text-gray-600 dark:text-gray-400" }, "Introduce tu número de teléfono para configurar la autenticación de dos factores."),
                    !codeSent ? (
                        React.createElement("form", { onSubmit: handleSendCode, className: "space-y-4" },
                            React.createElement(Input, { id: "phone", label: "Número de Teléfono", type: "tel", value: phone, onChange: e => setPhone(e.target.value), required: true, placeholder: "+34 600 123 456" }),
                            React.createElement(Button, { type: "submit", isLoading: isLoading, children: "Enviar Código" })
                        )
                    ) : (
                        React.createElement("form", { onSubmit: handleVerifyCode, className: "space-y-4" },
                            React.createElement("p", { className: "text-sm text-green-600" }, "Se ha enviado un código a ", phone, ". (Pista: es 123456)"),
                            React.createElement(Input, { id: "code", label: "Código de Verificación", type: "text", value: code, onChange: e => setCode(e.target.value), required: true, placeholder: "código de 6 dígitos" }),
                            React.createElement(Button, { type: "submit", isLoading: isLoading, children: "Verificar Teléfono" })
                        )
                    )
                );
            case 'location':
                return React.createElement("div", null,
                    React.createElement("h3", { className: "text-xl font-semibold mb-2" }, "Paso 3: Configura tu Ubicación"),
                    React.createElement("p", { className: "mb-4 text-gray-600 dark:text-gray-400" }, "Esto nos ayuda a encontrar intercambios cerca de ti."),
                    React.createElement(Button, { onClick: handleAutoDetectLocation, isLoading: isLocating, variant: "secondary", className: "mb-4 w-full", children: React.createElement("div", { className: "flex items-center gap-2" }, React.createElement("span", { className: theme.textColor }, ICONS.location), " Reintentar Autodetección")
                    }),
                    React.createElement("form", { onSubmit: handleSaveLocation, className: "space-y-4" },
                        React.createElement(AutocompleteInput, { id: "country", label: "País", value: country, onChange: handleCountryChange, required: true, suggestions: countries, placeholder: "Escribe tu país..." }),
                        React.createElement(AutocompleteInput, { id: "city", label: "Ciudad", value: city, onChange: setCity, required: true, suggestions: citiesForSelectedCountry, placeholder: "Escribe tu ciudad...", disabled: !country }),
                        React.createElement(Input, { id: "address", label: "Dirección (Calle, número, piso)", type: "text", value: address, onChange: e => setAddress(e.target.value), required: true, placeholder:"Ej: Calle Principal, 123, 2B" }),
                        React.createElement(Input, { id: "postalCode", label: "Código Postal", type: "text", value: postalCode, onChange: e => setPostalCode(e.target.value), required: true }),
                        React.createElement(Button, { type: "submit", isLoading: isLoading, children: "Guardar Ubicación" })
                    )
                );
            case 'preferences':
                return React.createElement("div", null,
                    React.createElement("h3", { className: "text-xl font-semibold mb-2" }, "Último Paso: ¿En qué estás interesado?"),
                    React.createElement("p", { className: "mb-4 text-gray-600 dark:text-gray-400" }, "Selecciona categorías para personalizar tu feed."),
                    React.createElement("div", { className: "space-y-4" },
                        CATEGORIES_WITH_SUBCATEGORIES.map(cat => React.createElement("div", { key: cat.name },
                            React.createElement("h4", { className: "font-semibold text-lg border-b dark:border-gray-600 pb-1 mb-2" }, cat.name),
                            React.createElement("div", { className: "grid grid-cols-2 sm:grid-cols-3 gap-2" },
                                (cat.sub.length > 0 ? cat.sub : [cat.name]).map(subCat => React.createElement("label", { key: subCat, className: "flex items-center space-x-2 cursor-pointer p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700" },
                                    React.createElement("input", { type: "checkbox", className: `h-4 w-4 rounded border-gray-300 ${theme.textColor} ${theme.focus}`,
                                        checked: preferences.includes(subCat),
                                        onChange: () => handlePreferenceChange(subCat)
                                    }),
                                    React.createElement("span", null, subCat)
                                ))
                            )
                        ))
                    ),
                    React.createElement(Button, { onClick: handleSavePreferences, isLoading: isLoading, className: "mt-6 w-full", children: "Completar Configuración y Entrar a Swapit" })
                );
            case 'complete':
                return React.createElement("div", { className: "text-center" },
                    React.createElement("div", { className: "flex justify-center mb-4" }, 
                        React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-16 w-16 text-green-500", viewBox: "0 0 20 20", fill: "currentColor" }, React.createElement("path", { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z", clipRule: "evenodd" }))
                    ),
                    React.createElement("h3", { className: "text-xl font-semibold" }, "¡Configuración Completa!"),
                    React.createElement("p", { className: "text-gray-600 dark:text-gray-400" }, "Redirigiendo a la página principal..."),
                    React.createElement(SwapSpinner, null)
                );
        }
    }

    return (
        React.createElement(React.Fragment, null,
            React.createElement(TutorialModal, { isOpen: step === 'tutorial', onClose: handleTutorialClose }),
            React.createElement("div", { className: `max-w-xl mx-auto py-12 transition-opacity duration-500 ${step === 'tutorial' ? 'opacity-0 pointer-events-none' : 'opacity-100'}` },
                React.createElement("div", { className: "bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg" },
                     React.createElement("h2", { className: "text-3xl font-bold text-center mb-6" }, "¡Bienvenido a Swapit!"),
                     error && React.createElement("p", { className: "text-red-500 text-sm text-center mb-4 p-2 bg-red-100 dark:bg-red-900/50 rounded-md" }, error),
                     renderStepContent()
                )
            )
        )
    );
};

export default OnboardingPage;