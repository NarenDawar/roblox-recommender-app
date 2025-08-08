// firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, doc, getDoc } from 'firebase/firestore';

// Get Firebase configuration from environment variables
// These variables must be set in your project's .env.local file
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

// In a non-Canvas environment, authentication is handled by the login/signup components,
// so this function can be simplified. It's good practice to export the instances
// directly and let other components handle the sign-in flow.
export const initializeAuth = () => {
  console.log("Firebase services initialized.");
};

export { onAuthStateChanged, collection, addDoc, onSnapshot, doc, getDoc };
