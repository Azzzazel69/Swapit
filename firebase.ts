import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported as isAnalyticsSupported } from 'firebase/analytics';
import { getRemoteConfig, fetchAndActivate, getValue } from 'firebase/remote-config';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import firebaseConfig from './firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Initialize Firestore with fallback and safety
let dbInstance;
try {
    const dbId = firebaseConfig.firestoreDatabaseId;
    if (dbId && dbId !== "(default)" && !dbId.startsWith("TODO")) {
        console.log(`Firebase: Intentando inicializar base de datos específica: ${dbId}`);
        dbInstance = getFirestore(app, dbId);
    } else {
        console.log("Firebase: Usando base de datos Firestore (default)");
        dbInstance = getFirestore(app);
    }
} catch (error) {
    console.warn("Firebase: Error al inicializar base de datos específica, reintentando con (default):", error);
    try {
        dbInstance = getFirestore(app);
    } catch (secondError) {
        console.error("Firebase: Error fatal al inicializar Firestore:", secondError);
        // We still assign it to something to avoid undefined exports if possible
        dbInstance = getFirestore(app); 
    }
}

export const db = dbInstance;
export const auth = getAuth(app);
console.log("firebase.ts: Inicialización de Firebase completada");
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize App Check (if a reCAPTCHA key is provided in environment)
// To enable this, add VITE_RECAPTCHA_V3_SITE_KEY to your .env file
/*
if (import.meta.env.VITE_RECAPTCHA_V3_SITE_KEY) {
  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(import.meta.env.VITE_RECAPTCHA_V3_SITE_KEY),
      isTokenAutoRefreshEnabled: true
    });
    console.log('App Check initialized');
  } catch (e) {
    console.error('Failed to initialize App Check', e);
  }
}
*/

// Initialize Analytics (only if supported in the current environment)
export let analytics: any = null;
isAnalyticsSupported().then((supported) => {
  if (supported) {
    analytics = getAnalytics(app);
  }
});

// Initialize Remote Config
export const remoteConfig = getRemoteConfig(app);
remoteConfig.settings.minimumFetchIntervalMillis = 3600000; // 1 hour
remoteConfig.defaultConfig = {
  maintenance_mode: false,
  welcome_message: "¡Bienvenido a SwapIt!",
  max_swipes_per_day: 50
};

// Fetch and activate config
fetchAndActivate(remoteConfig)
  .then(() => {
    console.log('Remote Config loaded');
  })
  .catch((err) => {
    console.error('Failed to load Remote Config', err);
  });
