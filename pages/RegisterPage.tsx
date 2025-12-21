
import React, { useState, useMemo, useCallback } from 'react';
import { api } from '../services/api.ts';
import { Link, useNavigate } from 'react-router-dom';
import Input from '../components/Input.tsx';
import Button from '../components/Button.tsx';
import { useAuth } from '../hooks/useAuth.tsx';
import { useColorTheme } from '../hooks/useColorTheme.tsx';
import { ICONS } from '../constants.tsx';
import LocationSelector from '../components/LocationSelector.tsx';

const PasswordStrengthIndicator = ({ password }) => {
    const checks = useMemo(() => {
        const hasLength = password.length >= 8;
        const hasUpper = /[A-Z]/.test(password);
        const hasLower = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        return { hasLength, hasUpper, hasLower, hasNumber };
    }, [password]);

    const Check = ({ valid, text }) => (
        <li className={`flex items-center gap-2 text-sm ${valid ? 'text-green-500' : 'text-gray-400'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {valid 
                    ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /> 
                    : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                }
            </svg>
            {text}
        </li>
    );

    return (
        <ul className="space-y-1 mt-2">
            <Check valid={checks.hasLength} text="Al menos 8 caracteres" />
            <Check valid={checks.hasUpper} text="Contiene una letra mayúscula" />
            <Check valid={checks.hasLower} text="Contiene una letra minúscula" />
            <Check valid={checks.hasNumber} text="Contiene un número" />
        </ul>
    );
};

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [locationData, setLocationData] = useState<any>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { theme } = useColorTheme();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  const isPasswordValid = useMemo(() => {
    return password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password);
  }, [password]);

  const handleLocationChange = useCallback((data) => {
    setLocationData(data);
    setError(null);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agreedToTerms) {
        setError("Debes aceptar los Términos de Servicio para registrarte.");
        return;
    }
    if (!locationData) {
        setError("Por favor, indica tu ubicación.");
        return;
    }
    if (!isPasswordValid) {
        setError("La contraseña no cumple los requisitos de seguridad.");
        return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await api.register(name, email, password, '', { 
        province: locationData.province, 
        city: locationData.city,
        community: locationData.community,
        lat: locationData.lat,
        lng: locationData.lng,
        locationId: locationData.cityId
      });
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('cookie_consent', 'accepted');
      }
      navigate('/verify-email', { state: { email } });
    } catch (err: any) {
      if (err.message.includes('Ya existe un usuario con este correo')) {
          setError(
              <span>
                  Ya existe un usuario con este correo. ¿Has{' '}
                  <Link to="/forgot-password" state={{email}} className={`font-medium ${theme.textColor} ${theme.hoverTextColor}`}>
                      olvidado tu contraseña?
                  </Link>
              </span>
          );
      } else {
          setError(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 p-10 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Crea tu cuenta
          </h2>
          <p className="mt-2 text-center text-sm text-gray-500">Empieza a intercambiar hoy mismo</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && <div className="text-red-500 text-sm text-center p-3 bg-red-100 dark:bg-red-900/50 rounded-lg">{error}</div>}
          
          <div className="flex flex-col gap-y-5">
            <Input id="name" label="Nombre completo" name="name" type="text" autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" />
            
            {/* z-index crucial: z-30 es mayor que el z-index por defecto de los campos de abajo */}
            <div className="relative z-30 bg-gray-50 dark:bg-gray-900/30 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-inner">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Ubicación para intercambios</h3>
                <LocationSelector onChange={handleLocationChange} onError={setError} />
            </div>

            <div className="relative z-20 space-y-5">
                <Input id="email-address" label="Correo electrónico" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@ejemplo.com" />
                
                <div>
                    <Input 
                        id="password" 
                        label="Contraseña" 
                        name="password" 
                        type={passwordVisible ? 'text' : 'password'} 
                        autoComplete="new-password" 
                        required 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        placeholder="Crea una contraseña"
                        icon={passwordVisible ? ICONS.eyeOff : ICONS.eye}
                        onIconClick={() => setPasswordVisible(!passwordVisible)}
                    />
                    <PasswordStrengthIndicator password={password} />
                </div>
                
                <Input 
                    id="confirm-password" 
                    label="Confirmar contraseña" 
                    name="confirm-password" 
                    type={confirmPasswordVisible ? 'text' : 'password'} 
                    autoComplete="new-password" 
                    required 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    placeholder="Repite la contraseña"
                    icon={confirmPasswordVisible ? ICONS.eyeOff : ICONS.eye}
                    onIconClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
                />
            </div>
          </div>
          
          <div className="flex items-start bg-gray-50 dark:bg-gray-900/20 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
              <div className="flex items-center h-5">
                  <input
                      id="terms"
                      name="terms"
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className={`h-4 w-4 rounded border-gray-300 ${theme.textColor} ${theme.focus}`}
                  />
              </div>
              <div className="ml-3 text-xs leading-tight">
                  <label htmlFor="terms" className="font-medium text-gray-700 dark:text-gray-300">
                      Acepto los{" "}
                      <Link to="/terms-of-service" target="_blank" className={`font-bold ${theme.textColor} underline`}>
                          Términos de Servicio
                      </Link>{" "}
                      y la Política de Cookies de Swapit.
                  </label>
              </div>
          </div>

          <div className="pt-2">
            <Button 
                type="submit" 
                isLoading={isLoading} 
                className="w-full shadow-lg transform active:scale-95 transition-transform" 
                disabled={!isPasswordValid || password !== confirmPassword || !agreedToTerms} 
                children="Finalizar Registro" 
            />
          </div>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
          ¿Ya eres Swapper?{' '}
          <Link to="/login" className={`font-bold ${theme.textColor} ${theme.hoverTextColor}`}>
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
