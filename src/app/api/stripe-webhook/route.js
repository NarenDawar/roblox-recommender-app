import Stripe from 'stripe';
import admin from 'firebase-admin';
import { NextResponse } from 'next/server';

// Ensure you have your service account key in the root of your project
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

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const db = admin.firestore();
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req) {
  const body = await req.text();
  // FIX: Get the signature from the incoming request's headers
  const signature = req.headers.get('stripe-signature');

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error(`[WEBHOOK ERROR] Signature verification failed: ${err.message}`);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // Handle the checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.client_reference_id;

    console.log(`[WEBHOOK] Received checkout session completed for user: ${userId}`);

    try {
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        const tier = subscription.metadata.tier;

        console.log(`[WEBHOOK] Retrieved tier from subscription metadata: "${tier}"`);

        if (userId && (tier === 'pro' || tier === 'enterprise')) {
            const userRef = db.collection('users').doc(userId);
            
            await userRef.update({
              tier: tier,
              analysisCount: 0,
              usageResetDate: admin.firestore.FieldValue.serverTimestamp(), 
            });

            console.log(`[WEBHOOK] Successfully updated Firestore for user ${userId} to tier: ${tier}`);
        } else {
            console.error(`[WEBHOOK] Update failed: Invalid userId or tier. UserID: ${userId}, Tier: ${tier}`);
        }

    } catch (error) {
        console.error(`[WEBHOOK] Error retrieving subscription or updating Firestore:`, error);
        return new NextResponse('Internal server error while processing webhook.', { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}