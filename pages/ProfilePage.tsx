

import React, { useState } from 'react';
// FIX: Changed import from useAuth.js to useAuth.tsx
import { useAuth } from '../hooks/useAuth.tsx';
import Button from '../components/Button.js';
import Input from '../components/Input.js';
import { ICONS, CATEGORIES } from '../constants.js';
import { api } from '../services/api.js';
import { useColorTheme } from '../hooks/useColorTheme.js';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const { theme } = useColorTheme();
  const [phone, setPhone] = useState(user?.phone || '');
  const [code, setCode] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(user?.phoneVerified || false);

  const [preferences, setPreferences] = useState(user?.preferences || []);
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);
  const [prefsSaved, setPrefsSaved] = useState(false);


  const handleSendCode = async (e) => {
    e.preventDefault();
    setIsVerifying(true);
    await new Promise(res => setTimeout(res, 1000));
    setVerificationSent(true);
    setIsVerifying(false);
  };
  
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setIsVerifying(true);
    await new Promise(res => setTimeout(res, 1000));
    setPhoneVerified(true);
    setVerificationSent(false);
    setIsVerifying(false);
  };

  const handlePreferenceChange = (category) => {
    setPreferences(prev => 
      prev.includes(category) 
        ? prev.filter(p => p !== category) 
        : [...prev, category]
    );
    setPrefsSaved(false);
  };

  const handleSavePreferences = async () => {
    if (!user) return;
    setIsSavingPrefs(true);
    try {
        const updatedUser = await api.updateUserPreferences(preferences);
        updateUser(updatedUser);
        setPrefsSaved(true);
        setTimeout(() => setPrefsSaved(false), 2000);
    } catch (error) {
        console.error("Error al guardar las preferencias", error);
    } finally {
        setIsSavingPrefs(false);
    }
  };

  if (!user) {
    return React.createElement("p", null, "Cargando perfil...");
  }

  return React.createElement("div", { className: "max-w-2xl mx-auto" },
    React.createElement("h1", { className: "text-3xl font-bold mb-6 text-gray-900 dark:text-white" }, "Mi Perfil"),
    React.createElement("div", { className: "bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md space-y-4" },
      React.createElement("div", null,
        React.createElement("h3", { className: "text-lg font-medium text-gray-900 dark:text-white" }, "Nombre"),
        React.createElement("p", { className: "mt-1 text-sm text-gray-600 dark:text-gray-300" }, user.name)
      ),
      React.createElement("div", { className: "border-t border-gray-200 dark:border-gray-700" }),
      React.createElement("div", null,
        React.createElement("h3", { className: "text-lg font-medium text-gray-900 dark:text-white" }, "Correo Electrónico"),
        React.createElement("p", { className: "mt-1 text-sm text-gray-600 dark:text-gray-300" }, user.email)
      ),
      React.createElement("div", { className: "border-t border-gray-200 dark:border-gray-700" }),
      React.createElement("div", null,
         React.createElement("h3", { className: "text-lg font-medium text-gray-900 dark:text-white" }, "Mis Intereses"),
         React.createElement("p", { className: "text-sm text-gray-600 dark:text-gray-300 mt-1 mb-3" }, "Selecciona las categorías que te interesan para personalizar tu página de inicio."),
         React.createElement("div", { className: "grid grid-cols-2 sm:grid-cols-3 gap-2" },
            CATEGORIES.map(category => React.createElement("label", { key: category, className: "flex items-center space-x-2 cursor-pointer" },
              React.createElement("input", { 
                type: "checkbox",
                className: `h-4 w-4 rounded border-gray-300 ${theme.textColor} ${theme.focus}`,
                checked: preferences.includes(category),
                onChange: () => handlePreferenceChange(category)
              }),
              React.createElement("span", { className: "text-sm text-gray-700 dark:text-gray-300" }, category)
            ))
         ),
         React.createElement("div", { className: "mt-4 flex items-center gap-4" },
// FIX: Pass children as a prop to the Button component to satisfy the type checker.
            React.createElement(Button, { onClick: handleSavePreferences, isLoading: isSavingPrefs, children: "Guardar Preferencias" }),
            prefsSaved && React.createElement("span", { className: "text-green-600 text-sm" }, "¡Preferencias guardadas!")
         )
      ),
      React.createElement("div", { className: "border-t border-gray-200 dark:border-gray-700" }),
      React.createElement("div", null,
        React.createElement("h3", { className: "text-lg font-medium text-gray-900 dark:text-white" }, "Verificación de Teléfono"),
        phoneVerified ? (
          React.createElement("div", { className: "mt-2 flex items-center gap-2 text-green-600 dark:text-green-400" },
            ICONS.checkCircle,
            React.createElement("span", null, "Tu número de teléfono está verificado.")
          )
        ) : (
          React.createElement("div", { className: "mt-2 space-y-4" },
            React.createElement("p", { className: "text-sm text-gray-600 dark:text-gray-300" },
              "Verifica tu número de teléfono para aumentar la confianza y desbloquear más funciones."
            ),
            !verificationSent ? (
              React.createElement("form", { onSubmit: handleSendCode, className: "flex items-end gap-2" },
                React.createElement("div", { className: "flex-grow" },
                  React.createElement(Input, { id: "phone", label: "Número de Teléfono", type: "tel", value: phone, onChange: e => setPhone(e.target.value), required: true, placeholder: "+34 600 123 456" })
                ),
// FIX: Pass children as a prop to the Button component to satisfy the type checker.
                React.createElement(Button, { type: "submit", isLoading: isVerifying, children: "Enviar Código" })
              )
            ) : (
              React.createElement("form", { onSubmit: handleVerifyCode, className: "flex items-end gap-2" },
                React.createElement("div", { className: "flex-grow" },
                  React.createElement(Input, { id: "code", label: "Código de Verificación", type: "text", value: code, onChange: e => setCode(e.target.value), required: true, placeholder: "Introduce el código de 6 dígitos" })
                ),
// FIX: Pass children as a prop to the Button component to satisfy the type checker.
                React.createElement(Button, { type: "submit", isLoading: isVerifying, children: "Verificar" })
              )
            )
          )
        )
      )
    )
  );
};

export default ProfilePage;
