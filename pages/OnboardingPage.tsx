
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth.tsx';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api.ts';
import Button from '../components/Button.tsx';
import Input from '../components/Input.tsx';
import SwapSpinner from '../components/SwapSpinner.tsx';
import { CATEGORIES_WITH_SUBCATEGORIES } from '../constants.tsx';
import { useColorTheme } from '../hooks/useColorTheme.tsx';
import { useToast } from '../hooks/useToast.tsx';
import LocationSelector from '../components/LocationSelector.tsx';
import { auth } from '../firebase.ts';
import TutorialModal from '../components/TutorialModal.tsx';
import { requestNotificationPermission } from '../services/pushNotifications.ts';

const OnboardingPage = () => {
    const { user, refreshUser } = useAuth();
    const { theme } = useColorTheme();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [step, setStep] = useState('initial_check');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | React.ReactNode>('');
    
    const [phone, setPhone] = useState('');
    const [countryCode, setCountryCode] = useState('+34');
    const [code, setCode] = useState('');
    const [codeSent, setCodeSent] = useState(false);
    const [isPhoneVerified, setIsPhoneVerified] = useState(false);
    const [locationData, setLocationData] = useState<any>(null);
    const [postalCode, setPostalCode] = useState('');
    const [address, setAddress] = useState('');
    const [preferences, setPreferences] = useState([]);
    
    const [name, setName] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('pending_registration_name') || auth.currentUser?.displayName || '';
        }
        return auth.currentUser?.displayName || '';
    });
    
    const [emailSent, setEmailSent] = useState(true); // Default to true as api.register now sends it
    
    const determineOnboardingStep = useCallback(async () => {
        if (!user) return;
        
        // If user is from Auth but not in Firestore, they need to complete profile
        if (user.needsProfile) {
            // Check if email was verified since last check
            if (!user.emailVerified && auth.currentUser?.emailVerified) {
                console.log("Email verificado detectado en determineOnboardingStep");
                await refreshUser();
                return;
            }

            if (!user.emailVerified) {
                setStep('email');
            } else if (!locationData || !postalCode) {
                // Try to load from localStorage if not already loaded
                if (!locationData) {
                    const savedLoc = typeof window !== 'undefined' ? localStorage.getItem('pending_registration_location') : null;
                    if (savedLoc) {
                        try {
                            const parsed = JSON.parse(savedLoc);
                            setLocationData(parsed);
                        } catch (e) {
                            console.error("Error parsing saved location", e);
                        }
                    }
                }
                setStep('location');
            } else {
                setStep('preferences');
            }
            return;
        }

        // Check if fully onboarded
        const isTestUser = user.email?.endsWith('@test.com');
        const isFullyOnboarded = isTestUser || (user.emailVerified && user.location && user.preferences?.length > 0);
        
        if (isFullyOnboarded) {
            setStep('complete');
            setTimeout(() => {
                navigate('/', { replace: true });
            }, 1500);
        } else if (!user.emailVerified) {
            setStep('email');
        } else if (!user.location || !user.location.province) {
            setStep('location');
        } else {
            setStep('preferences');
        }
    }, [user, navigate, refreshUser, locationData, isPhoneVerified]);

    useEffect(() => {
        const checkStatus = async () => {
            if (user) {
                console.log("OnboardingPage: Refrescando usuario para obtener estado de verificación");
                try {
                    await refreshUser();
                } catch (e) {
                    console.error("Error al refrescar usuario en OnboardingPage:", e);
                }
            }
        };
        checkStatus();
    }, []);

    useEffect(() => {
        if (user) {
            const isTestUser = user.email?.endsWith('@test.com');
            const tutorialCompleted = typeof window !== 'undefined' ? window.localStorage.getItem('tutorial_completed') === 'true' : true;
            if (!tutorialCompleted && !isTestUser) {
                setStep('tutorial');
            } else {
                determineOnboardingStep();
            }
        }
    }, [user, determineOnboardingStep]);

    useEffect(() => {
        if (user && step === 'email' && !user.emailVerified) {
            const interval = setInterval(async () => {
                console.log("Checking email verification status...");
                await auth.currentUser?.reload();
                if (auth.currentUser?.emailVerified) {
                    console.log("Email verified! Refreshing user...");
                    await refreshUser();
                    clearInterval(interval);
                }
            }, 3000);
            return () => clearInterval(interval);
        }
    }, [user, step, refreshUser]);

    const handleTutorialClose = () => {
        if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem('tutorial_completed', 'true');
        }
        determineOnboardingStep();
    };

    const handleSendEmail = async () => {
        setIsLoading(true); setError('');
        try {
            await api.sendEmailVerificationLink();
            setEmailSent(true);
            showToast("Correo enviado. Revisa tu bandeja de entrada.", "success");
        } catch (err: any) { 
            let friendlyError = err.message;
            if (err.message.includes('auth/too-many-requests')) {
                friendlyError = 'Has solicitado demasiados correos. Por favor, espera unos minutos.';
            }
            setError(friendlyError); 
            showToast(friendlyError, "error");
        } 
        finally { setIsLoading(false); }
    };

    const handleVerifyEmail = async () => {
        setIsLoading(true); setError('');
        try {
            const result = await api.checkEmailVerified();
            if (result.verified) {
                await refreshUser();
                showToast("Correo verificado con éxito", "success");
            } else {
                setError("El correo aún no ha sido verificado. Haz clic en el enlace que te enviamos.");
            }
        } catch (err: any) { setError(err.message); } 
        finally { setIsLoading(false); }
    };

    const handleSendPhoneCode = async (e) => {
        e.preventDefault();
        if (!phone || phone.length < 9) {
            setError("Introduce un número de teléfono válido.");
            return;
        }
        setIsLoading(true); setError('');
        
        const fullPhone = `${countryCode}${phone}`;
        try {
            const isRegistered = await api.checkPhoneInUse(fullPhone);
            if (isRegistered) {
                setError(
                    <span>
                        Ese número de teléfono ya está registrado en otra cuenta. ¿Es tuyo?{' '}
                        <Link to="/login" className="font-medium text-blue-500 hover:underline">
                            Inicia sesión aquí
                        </Link>
                    </span>
                );
                setIsLoading(false);
                return;
            }
            
            await api.sendPhoneVerificationCode(fullPhone);
            setCodeSent(true);
            setIsLoading(false);
            showToast(import.meta.env.DEV ? "Modo DEV: Usa el código 1234" : "Código SMS enviado a " + fullPhone, "success");
        } catch (err: any) {
            setError(err.message || "Error al enviar SMS");
            setIsLoading(false);
        }
    };

    const handleVerifyPhoneCode = async (e) => {
        e.preventDefault();
        if (!code || code.length < 4) {
            setError("El código debe tener al menos 4 dígitos (puedes usar 1234).");
            return;
        }
        setIsLoading(true); setError('');
        try {
            const verified = await api.verifyPhoneCode(code);
            if (verified) {
                if (user?.needsProfile) {
                    setIsPhoneVerified(true);
                    setStep('location');
                } else {
                    await api.updateUserProfileData({
                        phone: `${countryCode}${phone}`,
                        phoneVerified: true
                    });
                    await refreshUser();
                }
                showToast("Teléfono verificado con éxito", "success");
            } else {
                setError("Código incorrecto");
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveLocation = async (e) => {
        if (e) e.preventDefault();
        if (user?.needsProfile && !name.trim()) { setError('Por favor, indica tu nombre.'); return; }
        if (!locationData || !locationData.city || !locationData.province) { setError('Por favor, indica tu ubicación completa (Ciudad y Provincia).'); return; }
        setIsLoading(true); setError('');
        try {
            if (user?.needsProfile) {
                // Just save to state, will be sent in completeRegistration
                setStep('preferences');
            } else {
                await api.updateUserLocation({ ...locationData, postalCode, address });
                await refreshUser(); 
            }
        } catch (err: any) { setError(err.message); } 
        finally { setIsLoading(false); }
    };
    
    const handlePreferenceChange = (category) => {
        setPreferences(prev => prev.includes(category) ? prev.filter(p => p !== category) : [...prev, category]);
    };

    const handleSavePreferences = async () => {
        if (preferences.length === 0) { setError('Selecciona al menos un interés.'); return; }
        if (user?.needsProfile && (!locationData || !locationData.city || !locationData.province)) { 
            setError('Por favor, selecciona una ubicación válida antes de continuar.'); 
            setStep('location'); 
            return; 
        }
        setIsLoading(true); setError('');
        try {
            if (user?.needsProfile) {
                const finalName = name.trim() || 'Usuario';
                
                await api.completeRegistration({
                    name: finalName,
                    email: user.email,
                    location: { ...locationData, postalCode, address },
                    preferences: preferences,
                    phone: phone ? `${countryCode}${phone}` : null,
                    phoneVerified: true
                });
                
                // Cleanup
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('pending_registration_name');
                    localStorage.removeItem('pending_registration_location');
                }
            } else {
                await api.updateUserPreferences(preferences);
            }
            
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
                        <p className="mb-6 text-gray-600 dark:text-gray-400">
                            Para mantener la seguridad en SwapIt, necesitamos verificar tu correo electrónico: <strong>{user?.email}</strong>.
                        </p>
                        <div className="space-y-3">
                            {!emailSent ? (
                                <Button onClick={handleSendEmail} isLoading={isLoading} className="w-full" children="Enviar correo de verificación" />
                            ) : (
                                <>
                                    <p className="text-sm text-green-600 font-medium mb-4 text-center">¡Correo enviado! Revisa tu bandeja de entrada o la carpeta de spam.</p>
                                    <p className="text-xs text-gray-500 mb-4 text-center">Si no recibes el correo, es posible que estemos en fase beta y nuestra plataforma de envíos tenga un límite temporal. Espera unos minutos y revisa de nuevo.</p>
                                    <Button onClick={handleVerifyEmail} isLoading={isLoading} className="w-full" children="Ya he hecho clic en el enlace" />
                                    <button 
                                        onClick={handleSendEmail}
                                        className="w-full text-xs font-bold text-gray-500 hover:text-gray-700 underline py-2"
                                    >
                                        Reenviar correo
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                );
            case 'phone':
                return (
                    <div className="animate-fade-in-up">
                        <h3 className="text-xl font-bold mb-2">Paso 2: Verifica tu Teléfono</h3>
                        <p className="mb-6 text-gray-600 dark:text-gray-400">
                            Para evitar bots y mantener a salvo a la comunidad, necesitamos un número de teléfono válido. Se enviará un SMS real. Asegúrate de poner tu número real.
                        </p>
                        <div id="recaptcha-container" className="mb-4"></div>
                        {!codeSent ? (
                            <form onSubmit={handleSendPhoneCode} className="space-y-4">
                                <div className="flex gap-2">
                                    <div className="w-1/3">
                                        <Input 
                                            id="countryCode" 
                                            label="Prefijo" 
                                            type="text" 
                                            value={countryCode} 
                                            onChange={e => setCountryCode(e.target.value)} 
                                            required 
                                        />
                                    </div>
                                    <div className="w-2/3">
                                        <Input 
                                            id="phone" 
                                            label="Teléfono" 
                                            type="tel" 
                                            value={phone} 
                                            onChange={e => setPhone(e.target.value)} 
                                            placeholder="600 000 000"
                                            required 
                                        />
                                    </div>
                                </div>
                                <Button type="submit" isLoading={isLoading} className="w-full" children="Enviar código SMS" />
                            </form>
                        ) : (
                            <form onSubmit={handleVerifyPhoneCode} className="space-y-4">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Introduce el código que hemos enviado al {countryCode} {phone} (via SMS).
                                </p>
                                <Input 
                                    id="code" 
                                    label="Código de seguridad" 
                                    type="text" 
                                    value={code} 
                                    onChange={e => setCode(e.target.value)} 
                                    placeholder="----"
                                    className="text-center text-xl tracking-[0.5em]"
                                    required 
                                    maxLength={6}
                                />
                                <Button type="submit" isLoading={isLoading} className="w-full" children="Verificar y continuar" />
                                <button 
                                    type="button"
                                    onClick={() => setCodeSent(false)}
                                    className="w-full text-xs font-bold text-gray-500 hover:text-gray-700 underline py-2"
                                >
                                    Cambiar número de teléfono
                                </button>
                            </form>
                        )}
                    </div>
                );
            case 'location':
                return (
                    <div className="animate-fade-in-up">
                        <h3 className="text-xl font-bold mb-2">Paso 3: Perfil y Ubicación</h3>
                        <p className="mb-6 text-gray-600 dark:text-gray-400">Completa tu perfil para empezar a intercambiar.</p>
                        <form onSubmit={handleSaveLocation} className="space-y-6">
                            {user?.needsProfile && (
                                <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                                    <Input 
                                        id="name" 
                                        label="Tu Nombre" 
                                        type="text" 
                                        value={name} 
                                        onChange={(e: any) => setName(e.target.value)} 
                                        required 
                                        placeholder="Ej: Juan Pérez" 
                                    />
                                </div>
                            )}
                            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                                <LocationSelector 
                                    onChange={(data) => {
                                        setLocationData(data);
                                        setError('');
                                    }} 
                                    onError={setError}
                                />
                                
                                {locationData && (
                                    <div className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800 animate-fade-in">
                                        <p className="text-sm font-medium text-indigo-800 dark:text-indigo-300">
                                            📍 {locationData.city}, {locationData.province}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <Input 
                                    id="postalCode" 
                                    label="Código Postal" 
                                    type="text" 
                                    value={postalCode} 
                                    onChange={e => setPostalCode(e.target.value)} 
                                    placeholder="Ej: 28001"
                                    required 
                                />
                                <Input 
                                    id="address" 
                                    label="Dirección (Opcional)" 
                                    type="text" 
                                    value={address} 
                                    onChange={e => setAddress(e.target.value)} 
                                    placeholder="Calle, número, piso..."
                                />
                            </div>

                            <Button 
                                type="submit" 
                                isLoading={isLoading}
                                disabled={!locationData || !postalCode}
                                className="w-full py-4 text-lg font-bold shadow-lg shadow-indigo-500/20"
                                children="Continuar"
                            />
                        </form>
                    </div>
                );
            case 'preferences':
                return (
                    <div className="animate-fade-in-up">
                        <h3 className="text-xl font-bold mb-2">Paso 4: ¿Qué buscas?</h3>
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
            <div className={`max-w-xl mx-auto py-12 px-4 transition-all duration-500 ${step === 'tutorial' ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'}`}>
                <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700">
                     <h2 className="text-3xl font-black text-center mb-8">Bienvenido</h2>
                     {error && <p className="text-red-500 text-xs font-bold text-center mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">{error}</p>}
                     {renderStepContent()}
                     
                     <div className="mt-8 text-center border-t border-gray-100 dark:border-gray-700 pt-6">
                         <button 
                             onClick={() => {
                                 auth.signOut().then(() => {
                                     window.location.reload();
                                 });
                             }} 
                             className="text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 underline transition-colors"
                         >
                             Cerrar sesión y usar otra cuenta
                         </button>
                     </div>
                </div>
            </div>
        </React.Fragment>
    );
};

export default OnboardingPage;
