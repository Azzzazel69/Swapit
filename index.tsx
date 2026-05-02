
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { defineCustomElements } from '@ionic/pwa-elements/loader';

console.log("index.tsx: Iniciando montaje de la aplicación...");

// Initialize PWA elements for Capacitor plugins like Camera to work on web
try {
  defineCustomElements(window);
} catch (e) {
  console.log("Error initializing PWA elements", e);
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("index.tsx: No se encontró el elemento #root");
  throw new Error("Could not find root element to mount to");
}

try {
  const root = ReactDOM.createRoot(rootElement);
  console.log("index.tsx: Root de React creado con éxito");
  root.render(
    React.createElement(React.StrictMode, null, React.createElement(App, null))
  );
  console.log("index.tsx: Renderizado inicial solicitado");
} catch (e) {
  console.error("index.tsx: Error crítico durante el montaje:", e);
}
