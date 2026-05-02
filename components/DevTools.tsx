
import React, { useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import Button from './Button';
import { ChevronDown, ChevronUp, Trash2, RefreshCw, User, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DevTools = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const demoUsers = [
    { email: 'admin_seeder_v5@test.com', name: 'Admin' },
    { email: 'carlos_v5@test.com', name: 'Carlos' },
    { email: 'ana_v5@test.com', name: 'Ana' },
    { email: 'laura_v5@test.com', name: 'Laura' },
    { email: 'juan_v5@test.com', name: 'Juan' },
    { email: 'maria_v5@test.com', name: 'María' },
    { email: 'pedro_troll_v5@test.com', name: 'Troll' }
  ];

  const handleReset = async () => {
    // window.confirm can be problematic in iframes, removing it for better reliability
    console.log("DevTools: handleReset triggered");
    setIsLoading(true);
    try {
      showToast("Iniciando limpieza... por favor espera", "info");
      console.log("DevTools: Iniciando proceso de regeneración total...");
      
      await api.clearDatabase();
      console.log("DevTools: Limpieza completada");
      
      await api.seedDemoDatabase();
      console.log("DevTools: Seeding completado");
      
      showToast("Base de datos regenerada con éxito", "success");
      localStorage.setItem('swapit_db_seeded', 'true');
      
      // Small delay to ensure Firestore state is consistent
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Removed auto-login to let user decide
      showToast("Base de datos lista. Por favor, inicia sesión.", "info");
      
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 500);
    } catch (err: any) {
      console.error("DevTools: Error en reset:", err);
      showToast(`Error: ${err.message}`, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (email: string) => {
    setIsLoading(true);
    try {
      const { token } = await api.login(email, '123456');
      await login(token, true);
      setTimeout(() => {
         navigate('/', { replace: true });
      }, 300);
    } catch (err: any) {
      if (err.message.includes('Demasiados intentos')) {
         showToast("Firebase ha bloqueado tu IP temporalmente por seguridad. Espera 1-3 minutos e inténtalo de nuevo.", "error");
      } else {
         showToast(`Error login: ${err.message}`, "error");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-gray-800 text-white p-2 rounded-full shadow-lg hover:bg-gray-700 transition-colors flex items-center gap-2 px-4 text-xs font-mono"
        >
          <ShieldCheck size={16} />
          DEV TOOLS
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-gray-100 dark:bg-gray-800 p-3 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200 font-bold text-sm">
          <ShieldCheck size={18} className="text-primary" />
          Panel de Desarrollador
        </div>
        <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
          <ChevronDown size={20} />
        </button>
      </div>

      <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Acciones Críticas</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full justify-start gap-2 text-red-500 border-red-200 hover:bg-red-50 dark:hover:bg-red-900/10"
            onClick={handleReset}
            isLoading={isLoading}
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            LIMPIEZA TOTAL y Regenerar
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full justify-start gap-2 text-orange-500 border-orange-200"
            onClick={async () => {
              setIsLoading(true);
              try {
                await api.clearDatabase();
                showToast("Datos borrados", "success");
              } catch(e: any) {
                showToast(e.message, "error");
              } finally {
                setIsLoading(false);
              }
            }}
            isLoading={isLoading}
          >
            <Trash2 size={14} />
            Borrar Firestore (Sin Auth)
          </Button>
        </div>

        <div className="space-y-2">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Logins Rápidos (Demo)</p>
          <div className="grid grid-cols-2 gap-2">
            {demoUsers.map(u => (
              <button
                key={u.email}
                onClick={() => handleDemoLogin(u.email)}
                disabled={isLoading}
                className="text-[10px] p-2 bg-gray-50 dark:bg-gray-800 hover:bg-primary/10 border border-gray-200 dark:border-gray-700 rounded text-left transition-colors truncate"
              >
                {u.name}
              </button>
            ))}
          </div>
        </div>

        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-100 dark:border-blue-800">
          <div className="flex gap-2 text-blue-700 dark:text-blue-300">
            <AlertTriangle size={14} className="shrink-0" />
            <p className="text-[9px]">
              Este panel solo es visible en desarrollo. Usa "LIMPIEZA TOTAL" si experimentas errores de permisos o credenciales.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DevTools;
