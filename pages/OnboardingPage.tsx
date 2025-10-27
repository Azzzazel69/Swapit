

import React, { useState, useEffect } from 'react';
// FIX: Changed import from useAuth.js to useAuth.tsx
import { useAuth } from '../hooks/useAuth.tsx';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import Button from '../components/Button.js';
import Input from '../components/Input.js';
import Spinner from '../components/Spinner.js';
import { CATEGORIES_WITH_SUBCATEGORIES, ICONS } from '../constants.js';
import { useColorTheme } from '../hooks/useColorTheme.js';

const OnboardingPage = () => {
    const { user, refreshUser } = useAuth();
    const { theme } = useColorTheme();
    const navigate = useNavigate();
    const [step, setStep] = useState('email');
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
    const [isLocating, setIsLocating] = useState(false);

    // Preferences state
    const [preferences, setPreferences] = useState([]);
    
    useEffect(() => {
        if (user) {
            // Check if FULLY onboarded (including location and non-empty preferences)
            if (user.emailVerified && user.phoneVerified && user.location && user.preferences?.length > 0) {
                setStep('complete');
                setTimeout(() => navigate('/'), 2000);
            } else if (!user.emailVerified) {
                setStep('email');
            } else if (!user.phoneVerified) {
                setStep('phone');
            } else if (!user.location) {
                setStep('location');
            } else { // This covers the case where location is set but preferences are not.
                setStep('preferences');
            }
        }
    }, [user, navigate]);


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
                 setStep('location');
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
                setCountry("España");
                setCity("Madrid");
                setPostalCode("28013");
                setIsLocating(false);
            },
            (error) => {
                setError("No se pudo obtener la ubicación. Por favor, introdúcela manualmente.");
                setIsLocating(false);
            }
        );
    };

    const handleSaveLocation = async (e) => {
        e.preventDefault();
        setIsLoading(true); setError('');
        try {
            await api.updateUserLocation({ country, city, postalCode });
            await refreshUser(); // Refresh user to get location data
            setStep('preferences');
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
            await refreshUser();
        } catch (err) { setError(err.message); }
        finally { setIsLoading(false); }
    };

    const renderStep = () => {
        switch(step) {
            case 'email':
                return React.createElement("div", null,
                    React.createElement("h3", { className: "text-xl font-semibold mb-2" }, "Paso 1: Verifica tu Correo"),
                    React.createElement("p", { className: "mb-4 text-gray-600 dark:text-gray-400" }, "Se ha enviado un enlace de verificación a ", React.createElement("strong", null, user?.email), ". (Para esta demo, solo haz clic en el botón de abajo)."),
// FIX: Pass children as a prop to the Button component to satisfy the type checker.
                    React.createElement(Button, { onClick: handleVerifyEmail, isLoading: isLoading, children: "Confirmar Correo Electrónico" })
                );
            case 'phone':
                 return React.createElement("div", null,
                    React.createElement("h3", { className: "text-xl font-semibold mb-2" }, "Paso 2: Asegura tu Cuenta (2FA)"),
                    React.createElement("p", { className: "mb-4 text-gray-600 dark:text-gray-400" }, "Introduce tu número de teléfono para configurar la autenticación de dos factores."),
                    !codeSent ? (
                        React.createElement("form", { onSubmit: handleSendCode, className: "space-y-4" },
                            React.createElement(Input, { id: "phone", label: "Número de Teléfono", type: "tel", value: phone, onChange: e => setPhone(e.target.value), required: true, placeholder: "+34 600 123 456" }),
// FIX: Pass children as a prop to the Button component to satisfy the type checker.
                            React.createElement(Button, { type: "submit", isLoading: isLoading, children: "Enviar Código" })
                        )
                    ) : (
                        React.createElement("form", { onSubmit: handleVerifyCode, className: "space-y-4" },
                            React.createElement("p", { className: "text-sm text-green-600" }, "Se ha enviado un código a ", phone, ". (Pista: es 123456)"),
                            React.createElement(Input, { id: "code", label: "Código de Verificación", type: "text", value: code, onChange: e => setCode(e.target.value), required: true, placeholder: "código de 6 dígitos" }),
// FIX: Pass children as a prop to the Button component to satisfy the type checker.
                            React.createElement(Button, { type: "submit", isLoading: isLoading, children: "Verificar Teléfono" })
                        )
                    )
                );
            case 'location':
                return React.createElement("div", null,
                    React.createElement("h3", { className: "text-xl font-semibold mb-2" }, "Paso 3: Configura tu Ubicación"),
                    React.createElement("p", { className: "mb-4 text-gray-600 dark:text-gray-400" }, "Esto nos ayuda a encontrar intercambios cerca de ti."),
// FIX: Pass children as a prop to the Button component to satisfy the type checker.
                    React.createElement(Button, { onClick: handleAutoDetectLocation, isLoading: isLocating, variant: "secondary", className: "mb-4 w-full", children: React.createElement("div", { className: "flex items-center gap-2" }, React.createElement("span", { className: theme.textColor }, ICONS.location), " Autodetectar mi Ubicación")
                    }),
                    React.createElement("form", { onSubmit: handleSaveLocation, className: "space-y-4" },
                        React.createElement(Input, { id: "country", label: "País", type: "text", value: country, onChange: e => setCountry(e.target.value), required: true }),
                        React.createElement(Input, { id: "city", label: "Ciudad", type: "text", value: city, onChange: e => setCity(e.target.value), required: true }),
                        React.createElement(Input, { id: "postalCode", label: "Código Postal", type: "text", value: postalCode, onChange: e => setPostalCode(e.target.value), required: true }),
// FIX: Pass children as a prop to the Button component to satisfy the type checker.
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
// FIX: Pass children as a prop to the Button component to satisfy the type checker.
                    React.createElement(Button, { onClick: handleSavePreferences, isLoading: isLoading, className: "mt-6 w-full", children: "Completar Configuración y Entrar a Swapit" })
                );
            case 'complete':
                return React.createElement("div", { className: "text-center" },
                    React.createElement("div", { className: "flex justify-center mb-4" }, 
                        React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-16 w-16 text-green-500", viewBox: "0 0 20 20", fill: "currentColor" }, React.createElement("path", { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z", clipRule: "evenodd" }))
                    ),
                    React.createElement("h3", { className: "text-xl font-semibold" }, "¡Configuración Completa!"),
                    React.createElement("p", { className: "text-gray-600 dark:text-gray-400" }, "Redirigiendo a la página principal..."),
                    React.createElement(Spinner, null)
                );
        }
    }

    return React.createElement("div", { className: "max-w-xl mx-auto py-12" },
        React.createElement("div", { className: "bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg" },
             React.createElement("h2", { className: "text-3xl font-bold text-center mb-6" }, "¡Bienvenido a Swapit!"),
             error && React.createElement("p", { className: "text-red-500 text-sm text-center mb-4 p-2 bg-red-100 dark:bg-red-900/50 rounded-md" }, error),
             renderStep()
        )
    );
};

export default OnboardingPage;