// /api/stripe-webhook/route.js

import Stripe from 'stripe';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app'; // Removed 'cert'

// Initialize Firebase Admin SDK
if (!getApps().length) {
  initializeApp();
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const db = getFirestore();

export async function POST(req) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // Handle the checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.client_reference_id; // The user ID you passed during checkout

    if (userId) {
      const userRef = db.collection('users').doc(userId);
      
      // Update the user's document to the 'pro' tier
      await userRef.update({
        tier: 'pro',
        analysisCount: 0, // Reset their usage count
        usageResetDate: null // Reset the date
      });
    }
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
}