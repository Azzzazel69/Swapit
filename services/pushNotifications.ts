// services/pushNotifications.ts

import firebase from 'firebase/compat/app';
import 'firebase/compat/messaging';
import { firebaseConfig, VAPID_KEY } from './firebaseConfig.ts';
import { api } from './api.ts';

let messaging;

/**
 * Initializes the push notification service using Firebase.
 * This should be called once when the application loads for a logged-in user.
 */
export const initializePushNotifications = () => {
    console.log("Push Notification Service: Initializing with Firebase");
    try {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }

        if (firebase.messaging.isSupported()) {
            messaging = firebase.messaging();

            // Handle incoming messages when the app is in the foreground.
            messaging.onMessage((payload) => {
                console.log('Foreground message received.', payload);
                // In a real app, you would show a toast notification here.
                // Example: MyToastLib.show(payload.notification.title, payload.notification.body);
            });
        } else {
            console.log("Push Notification Service: Firebase Messaging is not supported in this browser.");
        }
    } catch (error) {
        console.error("Error initializing Firebase for Push Notifications:", error);
    }
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
    if (!messaging) {
        console.log("Messaging not initialized. Cannot get token.");
        return false;
    }

    try {
        const currentToken = await messaging.getToken({ vapidKey: VAPID_KEY });
        if (currentToken) {
            console.log('FCM Token retrieved:', currentToken);
            // Send the token to your server to associate it with the current user
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