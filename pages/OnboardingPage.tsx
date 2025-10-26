import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import Button from '../components/Button';
import Input from '../components/Input';
import Spinner from '../components/Spinner';
import { CATEGORIES_WITH_SUBCATEGORIES, ICONS } from '../constants';

type OnboardingStep = 'email' | 'phone' | 'location' | 'preferences' | 'complete';

const OnboardingPage: React.FC = () => {
    const { user, refreshUser } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState<OnboardingStep>('email');
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
    const [preferences, setPreferences] = useState<string[]>([]);
    
    useEffect(() => {
        if (user) {
            if (user.emailVerified && user.phoneVerified) {
                setStep('complete');
                setTimeout(() => navigate('/'), 1000);
            } else if (user.emailVerified) {
                setStep('phone');
            } else {
                setStep('email');
            }
        }
    }, [user, navigate]);

    const handleVerifyEmail = async () => {
        setIsLoading(true); setError('');
        try {
            await api.verifyEmail();
            await refreshUser();
        } catch (err) { setError((err as Error).message); } 
        finally { setIsLoading(false); }
    };

    const handleSendCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true); setError('');
        try {
            await api.sendPhoneVerificationCode(phone);
            setCodeSent(true);
        } catch (err) { setError((err as Error).message); } 
        finally { setIsLoading(false); }
    };

    const handleVerifyCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true); setError('');
        try {
            const success = await api.verifyPhoneCode(code);
            if (success) {
                await refreshUser();
                 setStep('location'); // Manually advance step after successful verification
            } else {
                setError('Código de verificación incorrecto.');
            }
        } catch (err) { setError((err as Error).message); } 
        finally { setIsLoading(false); }
    };

    const handleAutoDetectLocation = () => {
        setIsLocating(true); setError('');
        navigator.geolocation.getCurrentPosition(
            (position) => {
                // En una aplicación real, usarías un servicio de geocodificación inversa aquí
                setCountry("España");
                setCity("Madrid");
                setPostalCode("28013");
                setIsLocating(false);
            },
            (error) => {
                setError("No se pudo obtener la ubicación. Por favor, introdúcela manually.");
                setIsLocating(false);
            }
        );
    };

    const handleSaveLocation = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true); setError('');
        try {
            await api.updateUserLocation({ country, city, postalCode });
            setStep('preferences');
        } catch (err) { setError((err as Error).message); } 
        finally { setIsLoading(false); }
    };
    
    const handlePreferenceChange = (category: string) => {
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
            await refreshUser(); // This should trigger the navigate in useEffect
        } catch (err) { setError((err as Error).message); }
        finally { setIsLoading(false); }
    };

    const renderStep = () => {
        switch(step) {
            case 'email':
                return (
                    <div>
                        <h3 className="text-xl font-semibold mb-2">Paso 1: Verifica tu Correo</h3>
                        <p className="mb-4 text-gray-600 dark:text-gray-400">Se ha enviado un enlace de verificación a <strong>{user?.email}</strong>. (Para esta demo, solo haz clic en el botón de abajo).</p>
                        <Button onClick={handleVerifyEmail} isLoading={isLoading}>Confirmar Correo Electrónico</Button>
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
                                <Button type="submit" isLoading={isLoading}>Enviar Código</Button>
                            </form>
                        ) : (
                            <form onSubmit={handleVerifyCode} className="space-y-4">
                                <p className="text-sm text-green-600">Se ha enviado un código a {phone}. (Pista: es 123456)</p>
                                <Input id="code" label="Código de Verificación" type="text" value={code} onChange={e => setCode(e.target.value)} required placeholder="código de 6 dígitos" />
                                <Button type="submit" isLoading={isLoading}>Verificar Teléfono</Button>
                            </form>
                        )}
                    </div>
                );
            case 'location':
                return (
                    <div>
                        <h3 className="text-xl font-semibold mb-2">Paso 3: Configura tu Ubicación</h3>
                        <p className="mb-4 text-gray-600 dark:text-gray-400">Esto nos ayuda a encontrar intercambios cerca de ti.</p>
                        <Button onClick={handleAutoDetectLocation} isLoading={isLocating} variant="secondary" className="mb-4 w-full">
                           <div className="flex items-center gap-2">{ICONS.location} Autodetectar mi Ubicación</div>
                        </Button>
                        <form onSubmit={handleSaveLocation} className="space-y-4">
                            <Input id="country" label="País" type="text" value={country} onChange={e => setCountry(e.target.value)} required />
                            <Input id="city" label="Ciudad" type="text" value={city} onChange={e => setCity(e.target.value)} required />
                            <Input id="postalCode" label="Código Postal" type="text" value={postalCode} onChange={e => setPostalCode(e.target.value)} required />
                            <Button type="submit" isLoading={isLoading}>Guardar Ubicación</Button>
                        </form>
                    </div>
                );
            case 'preferences':
                return (
                    <div>
                        <h3 className="text-xl font-semibold mb-2">Último Paso: ¿En qué estás interesado?</h3>
                        <p className="mb-4 text-gray-600 dark:text-gray-400">Selecciona categorías para personalizar tu feed.</p>
                        <div className="space-y-4">
                            {CATEGORIES_WITH_SUBCATEGORIES.map(cat => (
                                <div key={cat.name}>
                                    <h4 className="font-semibold text-lg border-b dark:border-gray-600 pb-1 mb-2">{cat.name}</h4>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {cat.sub.map(subCat => (
                                            <label key={subCat} className="flex items-center space-x-2 cursor-pointer p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                                                <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                    checked={preferences.includes(subCat)}
                                                    onChange={() => handlePreferenceChange(subCat)}
                                                />
                                                <span>{subCat}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Button onClick={handleSavePreferences} isLoading={isLoading} className="mt-6 w-full">Completar Configuración y Entrar a Swapit</Button>
                    </div>
                );
            case 'complete':
                return (
                     <div className="text-center">
                        <div className="flex justify-center mb-4">{ICONS.checkCircle}</div>
                        <h3 className="text-xl font-semibold">¡Configuración Completa!</h3>
                        <p className="text-gray-600 dark:text-gray-400">Redirigiendo a la página principal...</p>
                        <Spinner />
                    </div>
                )

        }
    }

    return (
        <div className="max-w-xl mx-auto py-12">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
                 <h2 className="text-3xl font-bold text-center mb-6">¡Bienvenido a Swapit!</h2>
                 {error && <p className="text-red-500 text-sm text-center mb-4 p-2 bg-red-100 dark:bg-red-900/50 rounded-md">{error}</p>}
                 {renderStep()}
            </div>
        </div>
    );
};

export default OnboardingPage;