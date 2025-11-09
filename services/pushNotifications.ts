import { Capacitor } from '@capacitor/core';
import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { api } from './api.ts';

let isInitialized = false;

const initializeNativePush = () => {
  if (!Capacitor.isNativePlatform()) {
    console.log("Not a native platform. Skipping native push initialization.");
    return;
  }
  
  if (isInitialized) {
    console.log("Native push already initialized.");
    return;
  }
  
  console.log("Initializing native push notifications...");

  PushNotifications.requestPermissions().then(result => {
    if (result.receive === 'granted') {
      PushNotifications.register();
    } else {
      console.warn("Push notification permission not granted.");
    }
  });

  PushNotifications.addListener('registration', (token: Token) => {
    console.log('Push registration success, token:', token.value);
    api.saveFcmToken(token.value);
  });

  PushNotifications.addListener('registrationError', (error: any) => {
    console.error('Error on push registration:', JSON.stringify(error));
  });

  PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
    console.log('Push received:', JSON.stringify(notification));
  });

  PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
    console.log('Push action performed:', JSON.stringify(action));
    const { data } = action.notification;
    if (data.exchangeId) {
        // Cuando el usuario toca la notificación, lo llevamos al chat correspondiente.
        window.location.href = `#/chat/${data.exchangeId}`;
    }
  });
  
  isInitialized = true;
};

export const initializePushNotifications = () => {
    initializeNativePush();
};

export const requestNotificationPermission = async (): Promise<boolean> => {
    if (!Capacitor.isNativePlatform()) {
        console.log("Not a native platform. Cannot request native permission.");
        return false;
    }
    try {
        const result = await PushNotifications.requestPermissions();
        if (result.receive === 'granted') {
            await PushNotifications.register();
            return true;
        }
    } catch (error) {
        console.error("Error requesting push notification permissions", error);
    }
    return false;
};
