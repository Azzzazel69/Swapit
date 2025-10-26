import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Input from '../components/Input';
import Button from '../components/Button';
import { api } from '../services/api';

const ForgotPasswordPage: React.FC = () => {
    const location = useLocation();
    const [email, setEmail] = useState(location.state?.email || '');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setMessage('');
        try {
            const response = await api.requestPasswordReset(email);
            setMessage(response.message);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 p-10 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
                        Restablece tu contraseña
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                        Introduce tu correo y te enviaremos instrucciones para restablecer tu contraseña.
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    {message && <p className="text-green-500 text-sm text-center">{message}</p>}
                    
                    {!message && (
                        <>
                            <Input
                                id="email-address"
                                label="Correo electrónico"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Correo electrónico"
                            />
                            <div>
                                <Button type="submit" isLoading={isLoading} className="w-full">
                                    Enviar Enlace
                                </Button>
                            </div>
                        </>
                    )}
                </form>
                <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                    ¿Recuerdas tu contraseña?{' '}
                    <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
                        Inicia sesión
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;