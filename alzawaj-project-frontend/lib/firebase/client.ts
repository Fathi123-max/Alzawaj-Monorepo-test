import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics, isSupported as analyticsIsSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY as string,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN as string,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID as string,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID as string,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID as string,
};

export function getFirebaseAuth() {
  if (!getApps().length) {
    initializeApp(firebaseConfig);
  }
  return getAuth();
}

export async function getFirebaseAnalytics() {
  if (typeof window === "undefined") return undefined;
  if (!getApps().length) {
    initializeApp(firebaseConfig);
  }
  const supported = await analyticsIsSupported();
  if (!supported) return undefined;
  try {
    return getAnalytics();
  } catch {
    return undefined;
  }
}
