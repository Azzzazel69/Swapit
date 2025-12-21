
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth.tsx';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api.ts';
import Button from '../components/Button.tsx';
import Input from '../components/Input.tsx';
import SwapSpinner from '../components/SwapSpinner.tsx';
import { CATEGORIES_WITH_SUBCATEGORIES, ICONS } from '../constants.tsx';
import { useColorTheme } from '../hooks/useColorTheme.tsx';
import HierarchicalLocationSelector from '../components/HierarchicalLocationSelector.tsx';
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
    const [locationData, setLocationData] = useState<any>(null);
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
        } else if (!user.location || !user.location.province) {
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
        } catch (err: any) { setError(err.message); } 
        finally { setIsLoading(false); }
    };

    const handleSendCode = async (e) => {
        e.preventDefault();
        setIsLoading(true); setError('');
        try {
            await api.sendPhoneVerificationCode(phone);
            setCodeSent(true);
        } catch (err: any) { setError(err.message); } 
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
        } catch (err: any) { setError(err.message); } 
        finally { setIsLoading(false); }
    };

    const handleLocationChange = useCallback((data) => {
        setLocationData(data);
    }, []);

    const handleSaveLocation = async (e) => {
        if (e) e.preventDefault();
        if (!locationData) {
            setError('Por favor, selecciona tu ubicación completa.');
            return;
        }
        setIsLoading(true); setError('');
        try {
            await api.updateUserLocation({ 
                country: 'España',
                province: locationData.province, 
                city: locationData.city, 
                community: locationData.community,
                postalCode, 
                address 
            });
            await refreshUser(); 
        } catch (err: any) { setError(err.message); } 
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
        } catch (err: any) { setError(err.message); }
        finally { setIsLoading(false); }
    };

    const renderStepContent = () => {
        switch(step) {
            case 'initial_check':
            case 'tutorial':
                return <SwapSpinner />;
            case 'email':
                return (
                    <div>
                        <h3 className="text-xl font-semibold mb-2">Paso 1: Verifica tu Correo</h3>
                        <p className="mb-4 text-gray-600 dark:text-gray-400">Se ha enviado un enlace de verificación a <strong>{user?.email}</strong>. (Para esta demo, solo haz clic en el botón de abajo).</p>
                        {/* Fix: Explicitly pass 'children' as a prop to satisfy the required constraint for the Button component */}
                        <Button onClick={handleVerifyEmail} isLoading={isLoading} children="Confirmar Correo Electrónico" />
                    </div>
                );
            case 'phone':
                 return (
                    <div>
                        <h3 className="text-xl font-semibold mb-2">Paso 2: Asegura tu Cuenta (2FA)</h3>
                        <p className="mb-4 text-gray-600 dark:text-gray-400">Introduce tu número de teléfono para configurar la autenticación de dos factores.</p>
                        {!codeSent ? (
                            <form onSubmit={handleSendCode} className="space-y-4">
                                <Input id="phone" label="Número de Teléfono" type="tel" value={phone} onChange={e => setPhone(e.target.value)} required placeholder="+34 600 123 456" />
                                {/* Fix: Explicitly pass 'children' as a prop to satisfy the required constraint for the Button component */}
                                <Button type="submit" isLoading={isLoading} children="Enviar Código" />
                            </form>
                        ) : (
                            <form onSubmit={handleVerifyCode} className="space-y-4">
                                <p className="text-sm text-green-600">Se ha enviado un código a {phone}. (Pista: es 123456)</p>
                                <Input id="code" label="Código de Verificación" type="text" value={code} onChange={e => setCode(e.target.value)} required placeholder="código de 6 dígitos" />
                                {/* Fix: Explicitly pass 'children' as a prop to satisfy the required constraint for the Button component */}
                                <Button type="submit" isLoading={isLoading} children="Verificar Teléfono" />
                            </form>
                        )}
                    </div>
                );
            case 'location':
                return (
                    <div>
                        <h3 className="text-xl font-semibold mb-2">Paso 3: Configura tu Ubicación</h3>
                        <p className="mb-4 text-gray-600 dark:text-gray-400">Esto nos ayuda a encontrar intercambios cerca de ti.</p>
                        <form id="location-form" onSubmit={handleSaveLocation} className="space-y-4">
                            <HierarchicalLocationSelector onChange={handleLocationChange} required />
                            <Input id="address" label="Dirección (Opcional)" type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="Ej: Calle Principal, 123" />
                            <Input id="postalCode" label="Código Postal" type="text" value={postalCode} onChange={e => setPostalCode(e.target.value)} required />
                        </form>
                        <div className="mt-6">
                            {/* Fix: Explicitly pass 'children' as a prop to satisfy the required constraint for the Button component */}
                            <Button type="submit" isLoading={isLoading} form="location-form" children="Guardar Ubicación" />
                        </div>
                    </div>
                );
            case 'preferences':
                return (
                    <div>
                        <h3 className="text-xl font-semibold mb-2">Último Paso: ¿En qué estás interesado?</h3>
                        <p className="mb-4 text-gray-600 dark:text-gray-400">Selecciona categorías para personalizar tu feed.</p>
                        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                            {CATEGORIES_WITH_SUBCATEGORIES.map(cat => (
                                <div key={cat.name}>
                                    <h4 className="font-semibold text-lg border-b dark:border-gray-600 pb-1 mb-2">{cat.name}</h4>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {(cat.sub.length > 0 ? cat.sub : [cat.name]).map(subCat => (
                                            <label key={subCat} className="flex items-center space-x-2 cursor-pointer p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                                <input type="checkbox" className={`h-4 w-4 rounded border-gray-300 ${theme.textColor} ${theme.focus}`}
                                                    checked={preferences.includes(subCat)}
                                                    onChange={() => handlePreferenceChange(subCat)}
                                                />
                                                <span className="text-sm">{subCat}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                        {/* Fix: Explicitly pass 'children' as a prop to satisfy the required constraint for the Button component */}
                        <Button onClick={handleSavePreferences} isLoading={isLoading} className="mt-6 w-full" children="Completar Configuración y Entrar a Swapit" />
                    </div>
                );
            case 'complete':
                return (
                    <div className="text-center">
                        <div className="flex justify-center mb-4"> 
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold">¡Configuración Completa!</h3>
                        <p className="text-gray-600 dark:text-gray-400">Redirigiendo a la página principal...</p>
                        <div className="flex justify-center mt-4">
                            <SwapSpinner />
                        </div>
                    </div>
                );
            default:
                return null;
        }
    }

    return (
        <React.Fragment>
            <TutorialModal isOpen={step === 'tutorial'} onClose={handleTutorialClose} />
            <div className={`max-w-xl mx-auto py-12 transition-opacity duration-500 ${step === 'tutorial' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
                     <h2 className="text-3xl font-bold text-center mb-6">¡Bienvenido a Swapit!</h2>
                     {error && <p className="text-red-500 text-sm text-center mb-4 p-2 bg-red-100 dark:bg-red-900/50 rounded-md">{error}</p>}
                     {renderStepContent()}
                </div>
            </div>
        </React.Fragment>
    );
};

export default OnboardingPage;
