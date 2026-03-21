import { useEffect, useState } from 'react';
import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { api } from '../services/api';
import { useAuth } from './useAuth';

export const usePushNotifications = () => {
  const { user } = useAuth();
  const [fcmToken, setFcmToken] = useState<string | null>(null);

  useEffect(() => {
    // Push Notifications are only available on native devices (iOS/Android)
    if (!Capacitor.isNativePlatform()) {
      console.log('Push notifications are not supported on the web.');
      return;
    }

    const registerPush = async () => {
      try {
        // Request permission to use push notifications
        // iOS will prompt user and return if they granted permission or not
        // Android will just grant without prompting
        let permStatus = await PushNotifications.checkPermissions();

        if (permStatus.receive === 'prompt') {
          permStatus = await PushNotifications.requestPermissions();
        }

        if (permStatus.receive !== 'granted') {
          console.warn('User denied push notification permission');
          return;
        }

        // Register with Apple / Google to receive push via APNS/FCM
        await PushNotifications.register();
      } catch (e) {
        console.error('Error registering for push notifications', e);
      }
    };

    registerPush();

    // On success, we should be able to receive notifications
    const registrationListener = PushNotifications.addListener('registration', async (token: Token) => {
      console.log('Push registration success, token: ' + token.value);
      setFcmToken(token.value);
      
      // Save the token to the user's profile in Firestore
      if (user?.id) {
        try {
          await api.updateUserProfileData({ fcmToken: token.value });
        } catch (e) {
          console.error('Error saving FCM token to user profile', e);
        }
      }
    });

    // Some issue with our setup and push will not work
    const errorListener = PushNotifications.addListener('registrationError', (error: any) => {
      console.error('Error on registration: ' + JSON.stringify(error));
    });

    // Show us the notification payload if the app is open on our device
    const pushReceivedListener = PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
      console.log('Push received: ' + JSON.stringify(notification));
      // Here you could show a custom in-app toast or alert
    });

    // Method called when tapping on a notification
    const pushActionPerformedListener = PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
      console.log('Push action performed: ' + JSON.stringify(notification));
      // Here you could navigate to a specific page based on notification data
      // e.g., if (notification.notification.data.exchangeId) navigate(`/exchanges`)
    });

    return () => {
      registrationListener.then(l => l.remove());
      errorListener.then(l => l.remove());
      pushReceivedListener.then(l => l.remove());
      pushActionPerformedListener.then(l => l.remove());
    };
  }, [user?.id]);

  return { fcmToken };
};
