import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyApciCekDkXoyrBC0qLpK3HJB32uAP7ADE",
  authDomain: "tour-desing.firebaseapp.com",
  projectId: "tour-desing",
  storageBucket: "tour-desing.firebasestorage.app",
  messagingSenderId: "858878380826",
  appId: "1:858878380826:web:5a8e3bd0a53f3447067aa3",
  measurementId: "G-XG5TFR5C11"
};

// Initialize Firebase only if there are no existing apps (prevents hot-reload errors)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Analytics conditionally (it requires window/browser environment)
let analytics;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export { app, analytics };
