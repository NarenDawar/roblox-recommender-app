// This is now a Server Component, so no 'use client' at the top of THIS file.
// Data fetching happens directly here.

import React from 'react'; // React is still needed for JSX
import { initializeApp as initializeAdminApp } from 'firebase-admin/app';
import admin from "firebase-admin";
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';
import { credential } from 'firebase-admin';

// Import the Client Component that contains the interactive UI
import RecommenderClient from './RecommenderClient';

// Initialize Firebase Admin SDK for server-side data fetching
// This runs once during the build process or on the server.
// Ensure these environment variables are set on your hosting platform.
const serviceAccountConfig = {
  type: process.env.FIREBASE_ADMIN_TYPE,
  projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
  privateKeyId: process.env.FIREBASE_ADMIN_PRIVATE_KEY_ID,
  privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/gm, "\n"), // Crucial: Replace escaped newlines
  clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
  clientId: process.env.FIREBASE_ADMIN_CLIENT_ID,
  authUri: process.env.FIREBASE_ADMIN_AUTH_URI,
  tokenUri: process.env.FIREBASE_ADMIN_TOKEN_URI,
  authProviderX509CertUrl: process.env.FIREBASE_ADMIN_AUTH_PROVIDER_X509_CERT_URL,
  clientX509CertUrl: process.env.FIREBASE_ADMIN_CLIENT_X509_CERT_URL,
  universeDomain: process.env.FIREBASE_ADMIN_UNIVERSE_DOMAIN,
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountConfig),
  });
}
const dbAdmin = getAdminFirestore();

// Home is now an async Server Component
export default async function Home() {
  // No `revalidate` export here for on-demand ISR.
  // The page will be statically generated at build time,
  // and revalidated only when /api/revalidate is called.

  let gamesData = [];
  let gamesLoadError = null;

  try {
    // Add `cache: 'no-store'` if you want to bypass the Next.js fetch cache
    // for this specific call, though for ISR with revalidatePath, it's often not needed
    // as revalidatePath handles the cache invalidation.
    // However, if dbAdmin.collection().get() is aggressively cached by the framework
    // despite revalidatePath, 'no-store' can ensure it always hits Firestore.
    // For typical ISR, `dbAdmin.collection().get()` itself is what provides the fresh data.
    const querySnapshot = await dbAdmin.collection('robloxGames').get();
    gamesData = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error fetching games data in Server Component:", error);
    gamesLoadError = "Failed to load games data. Please ensure Firebase Admin SDK environment variables are correctly set and Firebase rules allow read access.";
  }

  // Render loading/error state if data failed to load on the server
  if (gamesLoadError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-indigo-800 flex items-center justify-center p-4 font-sans antialiased">
        <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-2xl text-center">
          <p className="text-red-700 text-xl">{gamesLoadError}</p>
          <p className="mt-2 text-gray-600">Please check your Firebase setup and environment variables.</p>
        </div>
      </div>
    );
  }

  // Pass the fetched gamesData to the Client Component
  return (
    <RecommenderClient gamesData={gamesData} />
  );
}

// IMPORTANT: No `export const revalidate = ...` here for on-demand ISR.
// The page will be generated at build time, and then updated
// only when the revalidate API endpoint is called.