import React, { useState, useMemo } from 'react';
import { api } from '../services/api';
import { Link, useNavigate } from 'react-router-dom';
import Input from '../components/Input';
import Button from '../components/Button';
import { useAuth } from '../hooks/useAuth';

const PasswordStrengthIndicator: React.FC<{ password: string }> = ({ password }) => {
    const checks = useMemo(() => {
        const hasLength = password.length >= 8;
        const hasUpper = /[A-Z]/.test(password);
        const hasLower = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        return { hasLength, hasUpper, hasLower, hasNumber };
    }, [password]);

    const Check: React.FC<{ valid: boolean, text: string }> = ({ valid, text }) => (
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


const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<React.ReactNode | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const isPasswordValid = useMemo(() => {
    return password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password);
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      await api.register(name, email, password);
      const { token } = await api.login(email, password);
      await login(token);
      navigate('/onboarding');
    } catch (err) {
      if ((err as Error).message.includes('Ya existe un usuario con este correo')) {
          setError(
              <span>
                  Ya existe un usuario con este correo. ¿Has{' '}
                  <Link to="/forgot-password" state={{email}} className="font-medium text-indigo-600 hover:text-indigo-500">
                      olvidado tu contraseña?
                  </Link>
              </span>
          );
      } else {
          setError((err as Error).message);
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
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && <div className="text-red-500 text-sm text-center p-2 bg-red-100 dark:bg-red-900/50 rounded-md">{error}</div>}
          <div className="rounded-md shadow-sm -space-y-px flex flex-col gap-y-4">
            <Input id="name" label="Nombre Completo" name="name" type="text" autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu Nombre" />
            <Input id="email-address" label="Correo electrónico" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Correo electrónico" />
            <div>
                <Input id="password" label="Contraseña" name="password" type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña" />
                <PasswordStrengthIndicator password={password} />
            </div>
            <Input id="confirm-password" label="Confirmar Contraseña" name="confirm-password" type="password" autoComplete="new-password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirmar Contraseña" />
          </div>

          <div>
            <Button type="submit" isLoading={isLoading} className="w-full" disabled={!isPasswordValid || password !== confirmPassword}>
              Crear Cuenta
            </Button>
          </div>
        </form>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          ¿Ya tienes una cuenta?{' '}
          <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;