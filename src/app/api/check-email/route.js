import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';
import admin from 'firebase-admin';

// This block handles both Vercel deployment and local development
if (!admin.apps.length) {
  try {
    // When deployed to Vercel, use the environment variable
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        admin.initializeApp({
            credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY))
        });
    } else {
        // For local development, fall back to the serviceAccountKey.json file
        const serviceAccount = require('../../../../serviceAccountKey.json'); // Adjust path as needed
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    }
  } catch (error) {
    console.error('Firebase admin initialization error', error.stack);
  }
}

const db = getFirestore();
const auth = getAuth();

export async function POST(req) {
  try {
    const { email } = await req.json();

    // Check if a user exists in Firestore with this email and is inactive
    const usersRef = db.collection('users');
    const q = usersRef.where('email', '==', email);
    const querySnapshot = await q.get();

    if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        if (userData.status === 'inactive') {
            return new Response(JSON.stringify({ status: 'inactive' }), { status: 200 });
        }
    }

    // Check if a user exists in Firebase Auth (meaning they are active)
    try {
        await auth.getUserByEmail(email);
        return new Response(JSON.stringify({ status: 'active' }), { status: 200 });
    } catch (error) {
        // "user-not-found" is the expected error if the email is available
        if (error.code === 'auth/user-not-found') {
            return new Response(JSON.stringify({ status: 'available' }), { status: 200 });
        }
        // Re-throw other unexpected errors
        throw error;
    }

  } catch (error) {
    console.error("API Error in check-email:", error);
    return new Response(JSON.stringify({ error: 'An internal server error occurred.' }), { status: 500 });
  }
}