// services/pushNotifications.ts
import firebase from 'firebase/compat/app';
import 'firebase/compat/messaging';
import { firebaseConfig, VAPID_KEY } from './firebaseConfig.ts';
import { api } from './api.ts';

let messaging: firebase.messaging.Messaging | null = null;
let serviceWorkerRegistration: ServiceWorkerRegistration | null = null;

// Singleton promise to manage the initialization state.
// This prevents multiple initialization attempts and centralizes the result.
let initializationPromise: Promise<void> | null = null;

const performInitialization = (): Promise<void> => {
    // This function will be called once the window loads.
    return new Promise((resolve, reject) => {
        console.log("Push Notification Service: Starting initialization.");
        try {
            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
            }

            if (firebase.messaging.isSupported() && 'serviceWorker' in navigator) {
                const swUrl = `${location.origin}/firebase-messaging-sw.js`;
                
                navigator.serviceWorker.register(swUrl)
                    .then(registration => {
                        console.log('Firebase Service Worker registered successfully with scope:', registration.scope);
                        serviceWorkerRegistration = registration;
                        messaging = firebase.messaging();
                        messaging.onMessage((payload) => {
                            console.log('Foreground message received.', payload);
                             // In a real app, you would show a toast notification here.
                        });
                        resolve();
                    })
                    .catch(error => {
                        console.error("Service Worker registration failed:", error);
                        reject(error);
                    });
            } else {
                const reason = "Firebase Messaging or Service Workers are not supported in this browser.";
                console.log("Push Notification Service:", reason);
                reject(new Error(reason));
            }
        } catch (error) {
            console.error("Error during Firebase initialization:", error);
            reject(error);
        }
    });
};

export const initializePushNotifications = (): Promise<void> => {
    if (!initializationPromise) {
        initializationPromise = new Promise((resolve, reject) => {
            if (typeof window !== 'undefined') {
                const init = () => {
                    performInitialization().then(resolve).catch(reject);
                };

                if (document.readyState === 'complete') {
                    init();
                } else {
                    window.addEventListener('load', init, { once: true });
                }
            } else {
                reject(new Error("Cannot initialize push notifications outside of a browser environment."));
            }
        });
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
