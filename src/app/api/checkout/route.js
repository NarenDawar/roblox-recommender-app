import admin from 'firebase-admin';
import Stripe from 'stripe';
import { NextResponse } from 'next/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
if (!admin.apps.length) {
  try {
    // When deployed to Vercel, use the environment variable
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        admin.initializeApp({
            credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY))
        });
    } /* else {
      // For local development, fall back to the serviceAccountKey.json file
      const serviceAccount = require('../../../../serviceAccountKey.json'); // Adjust path as needed
      admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
      });
  }
      */
  } catch (error) {
    console.error('Firebase admin initialization error', error.stack);
  }
}

export async function POST(req) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
    }
    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const { priceId, plan } = await req.json();

    console.log(`[Checkout] Creating session for user: ${uid}, plan: ${plan}, priceId: ${priceId}`);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      // FIX: Added a URL parameter to pass the plan to the success page
      success_url: `${req.headers.get('origin')}/success?plan=${plan}`,
      cancel_url: `${req.headers.get('origin')}/cancel`,
      client_reference_id: uid,
      subscription_data: {
        metadata: {
          tier: plan,
        }
      }
    });

    return NextResponse.json({ sessionId: session.id });

  } catch (error) {
    console.error('[Checkout] Error creating checkout session:', error);
    if (error.code === 'auth/id-token-expired') {
        return NextResponse.json({ error: 'Unauthorized: Token expired' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}