import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';

if (!getApps().length) {
  initializeApp();
}

const db = getFirestore();
const auth = getAuth();

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    // Find the old, inactive user document by email
    const usersRef = db.collection('users');
    const q = usersRef.where('email', '==', email).where('status', '==', 'inactive');
    const querySnapshot = await q.get();
    
    if (querySnapshot.empty) {
      return new Response(JSON.stringify({ error: 'No inactive account found for this email.' }), { status: 404 });
    }
    
    const oldUserDoc = querySnapshot.docs[0];
    const oldUserData = oldUserDoc.data();

    // 1. Create a new user in Firebase Authentication
    const newUserRecord = await auth.createUser({
      email: email,
      password: password,
    });
    
    // 2. Create a NEW Firestore document with the NEW UID as its ID
    const newUserDocRef = db.collection('users').doc(newUserRecord.uid);
    
    // 3. Copy data from the old doc to the new one, ensuring it's active
    await newUserDocRef.set({
      ...oldUserData, // Copy existing data (like tier, analysisCount)
      uid: newUserRecord.uid, // Ensure the uid field matches the document ID
      status: 'active',
      deletedAt: null, // Clear the deletion timestamp
    });

    // 4. Delete the old user document to prevent duplicates
    await oldUserDoc.ref.delete();

    return new Response(JSON.stringify({ message: 'Account reactivated successfully.' }), { status: 200 });

  } catch (error) {
    console.error("API Error in reactivate-account:", error);
    return new Response(JSON.stringify({ error: 'An internal server error occurred.' }), { status: 500 });
  }
}