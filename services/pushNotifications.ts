// services/pushNotifications.ts
import firebase from 'firebase/compat/app';
import 'firebase/compat/messaging';
import { firebaseConfig, VAPID_KEY } from './firebaseConfig.ts';
import { api } from './api.ts';

let messaging: firebase.messaging.Messaging | null = null;
let serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
let initializationPromise: Promise<void> | null = null;

/**
 * Helper function to safely register the service worker only after the page has fully loaded.
 * This prevents the "document is in an invalid state" error.
 */
const registerServiceWorker = (): Promise<ServiceWorkerRegistration> => {
    return new Promise((resolve, reject) => {
        const register = async () => {
            if (!('serviceWorker' in navigator)) {
                return reject(new Error("Service workers are not supported in this browser."));
            }
            try {
                const swUrl = `${location.origin}/firebase-messaging-sw.js`;
                const registration = await navigator.serviceWorker.register(swUrl);
                console.log('Firebase Service Worker registered successfully with scope:', registration.scope);
                resolve(registration);
            } catch (error) {
                console.error('Service Worker registration failed:', error);
                reject(error);
            }
        };

        if (document.readyState === 'complete') {
            register();
        } else {
            window.addEventListener('load', register, { once: true });
        }
    });
};

/**
 * Initializes the push notification service using Firebase.
 * This function can be called multiple times, but will only run the initialization once.
 */
export const initializePushNotifications = () => {
    if (initializationPromise) {
        return initializationPromise;
    }

    initializationPromise = (async () => {
        console.log("Push Notification Service: Initializing with Firebase (Compat Mode)");
        try {
            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
            }

            if (firebase.messaging.isSupported()) {
                // Safely register the service worker and wait for it to be ready.
                serviceWorkerRegistration = await registerServiceWorker();

                // Get the messaging instance.
                messaging = firebase.messaging();

                // Set up a handler for foreground messages.
                messaging.onMessage((payload) => {
                    console.log('Foreground message received.', payload);
                    // In a real app, you would show a toast notification here.
                });
            } else {
                console.log("Push Notification Service: Firebase Messaging is not supported in this browser.");
            }
        } catch (error) {
            console.error("Error initializing Firebase for Push Notifications:", error);
            // Reset promise on failure to allow retries.
            initializationPromise = null; 
        }
    })();

    return initializationPromise;
};

/**
 * Requests permission from the user to send notifications and retrieves the FCM token.
 * @returns {Promise<boolean>} A promise that resolves to true if permission is granted and token is saved, false otherwise.
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
    console.log("Push Notification Service: Checking notification permissions.");

    if (typeof window === 'undefined' || !('Notification' in window)) {
        console.log("Push Notification Service: This browser does not support desktop notifications.");
        return false;
    }
    
    // Ensure initialization is complete before requesting permission
    await initializePushNotifications();

    try {
        const currentPermission = Notification.permission;
        if (currentPermission === 'granted') {
            console.log("Push Notification Service: Permission already granted.");
            return await getAndSaveToken();
        }

        if (currentPermission === 'denied') {
            console.log("Push Notification Service: Permission has been denied by the user.");
            return false;
        }

        if (currentPermission === 'default') {
            console.log("Push Notification Service: Requesting permission from user...");
            const permissionResult = await Notification.requestPermission();
            
            if (permissionResult === 'granted') {
                console.log("Push Notification Service: Permission granted!");
                return await getAndSaveToken();
            } else {
                console.log("Push Notification Service: Permission not granted.");
                return false;
            }
        }
    } catch (error) {
        console.error('Error requesting notification permission: ', error);
        return false;
    }
    
    return false;
};

/**
 * Retrieves the FCM token from Firebase and sends it to the backend for storage.
 */
const getAndSaveToken = async (): Promise<boolean> => {
    if (!messaging || !serviceWorkerRegistration) {
        console.log("Messaging or Service Worker not properly initialized. Cannot get token.");
        return false;
    }

    try {
        const currentToken = await messaging.getToken({ 
            vapidKey: VAPID_KEY,
            serviceWorkerRegistration: serviceWorkerRegistration 
        });
        if (currentToken) {
            console.log('FCM Token retrieved:', currentToken);
            await api.saveFcmToken(currentToken);
            return true;
        } else {
            console.log('No registration token available. Request permission to generate one.');
            return false;
        }
    } catch (err) {
        console.error('An error occurred while retrieving FCM token.', err);
        return false;
    }
};