
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth.tsx';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api.ts';
import Button from '../components/Button.tsx';
import Input from '../components/Input.tsx';
import SwapSpinner from '../components/SwapSpinner.tsx';
import { CATEGORIES_WITH_SUBCATEGORIES } from '../constants.tsx';
import { useColorTheme } from '../hooks/useColorTheme.tsx';
import LocationSelector from '../components/LocationSelector.tsx';
import { requestNotificationPermission } from '../services/pushNotifications.ts';
import TutorialModal from '../components/TutorialModal.tsx';

const OnboardingPage = () => {
    const { user, refreshUser } = useAuth();
    const { theme } = useColorTheme();
    const navigate = useNavigate();
    const [step, setStep] = useState('initial_check');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    
    const [phone, setPhone] = useState('');
    const [code, setCode] = useState('');
    const [codeSent, setCodeSent] = useState(false);
    const [locationData, setLocationData] = useState<any>(null);
    const [postalCode, setPostalCode] = useState('');
    const [address, setAddress] = useState('');
    const [preferences, setPreferences] = useState([]);
    
    const determineOnboardingStep = useCallback(() => {
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
    }, [user, navigate]);

    useEffect(() => {
        if (user) {
            const tutorialCompleted = typeof window !== 'undefined' ? window.localStorage.getItem('tutorial_completed') === 'true' : true;
            if (!tutorialCompleted) {
                setStep('tutorial');
            } else {
                determineOnboardingStep();
            }
        }
    }, [user, determineOnboardingStep]);

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
            if (success) { await refreshUser(); } 
            else { setError('Código incorrecto.'); }
        } catch (err: any) { setError(err.message); } 
        finally { setIsLoading(false); }
    };

    const handleSaveLocation = async (e) => {
        if (e) e.preventDefault();
        if (!locationData) { setError('Por favor, indica tu ubicación.'); return; }
        setIsLoading(true); setError('');
        try {
            await api.updateUserLocation({ ...locationData, postalCode, address });
            await refreshUser(); 
        } catch (err: any) { setError(err.message); } 
        finally { setIsLoading(false); }
    };
    
    const handlePreferenceChange = (category) => {
        setPreferences(prev => prev.includes(category) ? prev.filter(p => p !== category) : [...prev, category]);
    };

    const handleSavePreferences = async () => {
        if (preferences.length === 0) { setError('Selecciona al menos un interés.'); return; }
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
            case 'tutorial': return <SwapSpinner />;
            case 'email':
                return (
                    <div className="animate-fade-in-up">
                        <h3 className="text-xl font-bold mb-2">Paso 1: Verifica tu Correo</h3>
                        <p className="mb-6 text-gray-600 dark:text-gray-400">Pulsa el botón para simular la verificación de <strong>{user?.email}</strong>.</p>
                        <Button onClick={handleVerifyEmail} isLoading={isLoading} children="Confirmar Correo" />
                    </div>
                );
            case 'phone':
                 return (
                    <div className="animate-fade-in-up">
                        <h3 className="text-xl font-bold mb-2">Paso 2: Seguridad 2FA</h3>
                        <p className="mb-4 text-gray-600 dark:text-gray-400">Verifica tu identidad con tu móvil.</p>
                        {!codeSent ? (
                            <form onSubmit={handleSendCode} className="space-y-4">
                                <Input id="phone" label="Teléfono" type="tel" value={phone} onChange={e => setPhone(e.target.value)} required placeholder="+34 600 000 000" />
                                <Button type="submit" isLoading={isLoading} children="Enviar SMS" />
                            </form>
                        ) : (
                            <form onSubmit={handleVerifyCode} className="space-y-4">
                                <p className="text-sm text-green-600">SMS enviado. Pista demo: 123456</p>
                                <Input id="code" label="Código SMS" type="text" value={code} onChange={e => setCode(e.target.value)} required placeholder="6 dígitos" />
                                <Button type="submit" isLoading={isLoading} children="Verificar" />
                            </form>
                        )}
                    </div>
                );
            case 'location':
                return (
                    <div className="animate-fade-in-up">
                        <h3 className="text-xl font-bold mb-2">Paso 3: Tu Zona</h3>
                        <p className="mb-6 text-gray-600 dark:text-gray-400">Encuentra swappers cerca de ti.</p>
                        <form onSubmit={handleSaveLocation} className="space-y-4">
                            <LocationSelector onChange={setLocationData} onError={setError} />
                            <div className="pt-4 space-y-4">
                                <Input id="postalCode" label="Código Postal" type="text" value={postalCode} onChange={e => setPostalCode(e.target.value)} required />
                                <Button type="submit" isLoading={isLoading} disabled={!locationData} children="Guardar Ubicación" />
                            </div>
                        </form>
                    </div>
                );
            case 'preferences':
                return (
                    <div className="animate-fade-in-up">
                        <h3 className="text-xl font-bold mb-2">¿Qué buscas?</h3>
                        <p className="mb-4 text-gray-600 dark:text-gray-400">Personaliza tu catálogo.</p>
                        <div className="space-y-4 max-h-80 overflow-y-auto pr-2 mb-6">
                            {CATEGORIES_WITH_SUBCATEGORIES.map(cat => (
                                <div key={cat.name}>
                                    <h4 className="font-bold text-sm text-gray-400 uppercase tracking-widest mb-2">{cat.name}</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        {(cat.sub.length > 0 ? cat.sub : [cat.name]).map(subCat => (
                                            <label key={subCat} className={`flex items-center gap-2 p-2 rounded-lg border transition-colors cursor-pointer ${preferences.includes(subCat) ? `border-blue-500 bg-blue-50 dark:bg-blue-900/20` : 'border-gray-200 dark:border-gray-700'}`}>
                                                <input type="checkbox" className="hidden" checked={preferences.includes(subCat)} onChange={() => handlePreferenceChange(subCat)} />
                                                <span className="text-xs font-medium">{subCat}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Button onClick={handleSavePreferences} isLoading={isLoading} className="w-full" children="Entrar a Swapit" />
                    </div>
                );
            case 'complete':
                return (
                    <div className="text-center py-10 animate-heartbeat">
                        <div className="text-6xl mb-4">🚀</div>
                        <h3 className="text-2xl font-black">¡Todo listo!</h3>
                        <p className="text-gray-500">Preparando tu feed personalizado...</p>
                        <div className="flex justify-center mt-6"><SwapSpinner /></div>
                    </div>
                );
            default: return null;
        }
    }

    return (
        <React.Fragment>
            <TutorialModal isOpen={step === 'tutorial'} onClose={handleTutorialClose} />
            <div className={`max-w-xl mx-auto py-12 transition-all duration-500 ${step === 'tutorial' ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'}`}>
                <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700">
                     <h2 className="text-3xl font-black text-center mb-8">Bienvenido</h2>
                     {error && <p className="text-red-500 text-xs font-bold text-center mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">{error}</p>}
                     {renderStepContent()}
                </div>
            </div>
        </React.Fragment>
    );
};

export default OnboardingPage;
