import { FirebaseOptions, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const rawFirebaseConfig = {
  VITE_FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY ?? "",
  VITE_FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? "",
  VITE_FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "",
  VITE_FIREBASE_STORAGE_BUCKET: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? "",
  VITE_FIREBASE_MESSAGING_SENDER_ID: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "",
  VITE_FIREBASE_APP_ID: import.meta.env.VITE_FIREBASE_APP_ID ?? "",
};

const requiredFirebaseConfigKeys = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
] as const;

const firebaseConfig: FirebaseOptions = {
  apiKey: rawFirebaseConfig.VITE_FIREBASE_API_KEY,
  authDomain: rawFirebaseConfig.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: rawFirebaseConfig.VITE_FIREBASE_PROJECT_ID,
  ...(rawFirebaseConfig.VITE_FIREBASE_STORAGE_BUCKET
    ? { storageBucket: rawFirebaseConfig.VITE_FIREBASE_STORAGE_BUCKET }
    : {}),
  ...(rawFirebaseConfig.VITE_FIREBASE_MESSAGING_SENDER_ID
    ? { messagingSenderId: rawFirebaseConfig.VITE_FIREBASE_MESSAGING_SENDER_ID }
    : {}),
  ...(rawFirebaseConfig.VITE_FIREBASE_APP_ID ? { appId: rawFirebaseConfig.VITE_FIREBASE_APP_ID } : {}),
};

export const firebaseMissingConfig = requiredFirebaseConfigKeys.filter((key) => !rawFirebaseConfig[key]);
export const firebaseOptionalMissingConfig = Object.entries(rawFirebaseConfig)
  .filter(([key, value]) => !requiredFirebaseConfigKeys.includes(key as (typeof requiredFirebaseConfigKeys)[number]) && !value)
  .map(([key]) => key);

export const isFirebaseConfigured = firebaseMissingConfig.length === 0;
export const firebaseConfigErrorMessage =
  "El acceso no esta configurado correctamente. Intentalo de nuevo mas tarde.";

if (!isFirebaseConfigured && import.meta.env.DEV) {
  console.error(`${firebaseConfigErrorMessage} Variables pendientes: ${firebaseMissingConfig.join(", ")}.`);
}

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);

/**
 * Verifica que la configuracion Firebase requerida por autenticacion este presente.
 */
export function ensureFirebaseReady() {
  if (!isFirebaseConfigured) {
    throw new Error(firebaseConfigErrorMessage);
  }
}
