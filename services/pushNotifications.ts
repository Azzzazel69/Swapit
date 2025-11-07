// services/pushNotifications.ts
import firebase from 'firebase/compat/app';
import 'firebase/compat/messaging';
import { firebaseConfig, VAPID_KEY } from './firebaseConfig.ts';
import { api } from './api.ts';

let messaging: firebase.messaging.Messaging | null = null;
let serviceWorkerRegistration: ServiceWorkerRegistration | null = null;

// Create a single promise that resolves only when the window is fully loaded.
// This simplifies waiting for the correct document state and prevents race conditions.
const windowLoaded = new Promise<void>(resolve => {
    if (typeof window === 'undefined') {
        // Should not happen in a browser, but safe for server-side rendering contexts.
        return resolve();
    }
    if (document.readyState === 'complete') {
        resolve();
    } else {
        window.addEventListener('load', () => resolve(), { once: true });
    }
});

const performInitialization = async (): Promise<void> => {
    // 1. Wait for the window to be fully loaded before doing anything.
    await windowLoaded;
    console.log("Push Notification Service: Window loaded. Starting initialization.");

    try {
        // 2. Initialize Firebase App
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }

        // 3. Check for browser support
        if (!firebase.messaging.isSupported() || !('serviceWorker' in navigator)) {
            const reason = "Firebase Messaging or Service Workers are not supported in this browser.";
            console.log("Push Notification Service:", reason);
            throw new Error(reason);
        }

        // 4. Register the Service Worker
        // Construct the full URL based on the document's location to ensure the correct origin,
        // which prevents cross-origin errors in certain sandboxed environments.
        const swUrl = new URL('/firebase-messaging-sw.js', document.location.href).href;
        const registration = await navigator.serviceWorker.register(swUrl);
        console.log('Firebase Service Worker registered successfully with scope:', registration.scope);
        
        // 5. Initialize Messaging and set up listeners
        serviceWorkerRegistration = registration;
        messaging = firebase.messaging();
        messaging.onMessage((payload) => {
            console.log('Foreground message received.', payload);
             // In a real app, you would show a toast notification here.
        });

    } catch (error) {
        console.error("Error during Firebase initialization or Service Worker registration:", error);
        // Re-throw the error to be caught by the caller.
        throw error;
    }
};

// Singleton promise to ensure initialization only runs once.
let initializationPromise: Promise<void> | null = null;

export const initializePushNotifications = (): Promise<void> => {
    if (!initializationPromise) {
        if (typeof window === 'undefined') {
            return Promise.reject(new Error("Cannot initialize push notifications outside of a browser environment."));
        }
        initializationPromise = performInitialization();
    }
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
    
    try {
        await initializePushNotifications();
    } catch (error) {
        console.error("Initialization failed, cannot request permission.", error);
        return false;
    }

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
