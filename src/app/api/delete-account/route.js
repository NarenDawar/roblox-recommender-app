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
    const authorization = req.headers.get('authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const token = authorization.split('Bearer ')[1];
    const { uid } = await auth.verifyIdToken(token);

    // --- THE FIX IS HERE ---
    // First, try to update the user document, but don't fail if it doesn't exist.
    try {
        const userDocRef = db.collection('users').doc(uid);
        await userDocRef.update({
          status: 'inactive',
          deletedAt: new Date(),
        });
    } catch (error) {
        // Log the error if the document wasn't found, but continue execution.
        if (error.code === 5) { // '5' is the gRPC code for NOT_FOUND
             console.log(`User document for UID ${uid} not found. Proceeding with Auth deletion.`);
        } else {
            // Re-throw other unexpected errors
            throw error;
        }
    }
    
    // The most important step: delete the user from Firebase Auth to invalidate their session.
    await auth.deleteUser(uid);

    return new Response(JSON.stringify({ message: 'Account deactivated successfully.' }), { status: 200 });

  } catch (error) {
    console.error("API Error in delete-account:", error);
    return new Response(JSON.stringify({ error: 'An internal server error occurred.' }), { status: 500 });
  }
}