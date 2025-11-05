// services/pushNotifications.ts
import firebase from 'firebase/compat/app';
import 'firebase/compat/messaging';
import { firebaseConfig, VAPID_KEY } from './firebaseConfig.ts';
import { api } from './api.ts';

let messaging: firebase.messaging.Messaging | null = null;
let serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
let initializationPromise: Promise<void> | null = null;

// This promise will resolve only when the window's load event has fired.
const pageLoaded = new Promise<void>(resolve => {
    if (document.readyState === 'complete') {
        resolve();
    } else {
        window.addEventListener('load', () => resolve(), { once: true });
    }
});

/**
 * Performs the actual Firebase and Service Worker initialization.
 * This function is guaranteed to run only after the page is fully loaded.
 */
const performInitialization = async () => {
    // Explicitly wait for the page to be loaded before doing anything.
    await pageLoaded;

    console.log("Push Notification Service: Performing initialization.");
    try {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }

        if (firebase.messaging.isSupported()) {
            if (!('serviceWorker' in navigator)) {
                throw new Error("Service workers are not supported in this browser.");
            }
            
            const swUrl = `${location.origin}/firebase-messaging-sw.js`;
            serviceWorkerRegistration = await navigator.serviceWorker.register(swUrl);
            console.log('Firebase Service Worker registered successfully with scope:', serviceWorkerRegistration.scope);

            messaging = firebase.messaging();
            messaging.onMessage((payload) => {
                console.log('Foreground message received.', payload);
                 // In a real app, you would show a toast notification here.
            });
        } else {
            console.log("Push Notification Service: Firebase Messaging is not supported in this browser.");
        }
    } catch (error) {
        console.error("Error during Firebase initialization:", error);
        // Re-throw so the promise rejects, allowing callers to handle the failure.
        throw error;
    }
};

/**
 * Initializes the push notification service using Firebase.
 * This function creates a singleton promise to ensure initialization runs only once.
 */
export const initializePushNotifications = () => {
    if (!initializationPromise) {
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
    
    // Ensure initialization is complete before requesting permission.
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
