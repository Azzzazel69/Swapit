import { logEvent } from 'firebase/analytics';
import { analytics } from '../firebase';

export const logAppEvent = (eventName: string, eventParams?: any) => {
  if (analytics) {
    try {
      logEvent(analytics, eventName, eventParams);
    } catch (e) {
      console.error('Analytics error:', e);
    }
  }
};
