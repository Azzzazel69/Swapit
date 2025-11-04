// firebase-messaging-sw.js

// Scripts for Firebase. These are needed because service workers can't use ES modules.
importScripts('https://www.gstatic.com/firebasejs/12.5.0/firebase-app-compat.js');
// The analytics script is a recommended dependency for the messaging service to initialize correctly in all environments.
importScripts('https://www.gstatic.com/firebasejs/12.5.0/firebase-analytics-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.5.0/firebase-messaging-compat.js');

// NOTE: These are demo credentials for a placeholder project.
const firebaseConfig = {
  apiKey: "AIzaSyDOCAbp_DEMO_KEY_NOT_REAL_Q4pI",
  authDomain: "swapit-pwa-demo.firebaseapp.com",
  projectId: "swapit-pwa-demo",
  storageBucket: "swapit-pwa-demo.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:1a2b3c4d5e6f7a8b9c0d",
  measurementId: "G-DEMO123ABC"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.icon || '/vite.svg' // Default icon
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});