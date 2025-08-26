import Stripe from 'stripe';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps } from 'firebase-admin/app';

// --- ROBUST INITIALIZATION ---
if (!getApps().length) {
  initializeApp();
}
const auth = getAuth();
// --- END ---

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  try {
    // --- SECURITY CHECK ---
    const authorization = req.headers.get('authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Missing Bearer token' }), { status: 401 });
    }

    const token = authorization.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(token);
    } catch (error) {
      // --- MODIFICATION IS HERE ---
      // Log the detailed error to the server console for debugging.
      console.error("Firebase token verification failed:", error); 
      
      // You can also check for specific error codes for more tailored responses
      if (error.code === 'auth/id-token-expired') {
        return new Response(JSON.stringify({ error: 'Token expired', details: error.message }), { status: 401 });
      }
      
      return new Response(JSON.stringify({ error: 'Invalid token', details: error.message }), { status: 401 });
    }
    // --- END SECURITY CHECK & MODIFICATION ---

    const { userId, email } = await req.json();

    if (decodedToken.uid !== userId) {
        return new Response(JSON.stringify({ error: 'User mismatch' }), { status: 403 });
    }

    if (!userId || !email) {
      return new Response(JSON.stringify({ error: 'User information is missing.' }), { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Pro Plan',
              description: 'Full access to the Roblox Idea Analyzer Pro features.',
            },
            unit_amount: 1000,
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      client_reference_id: userId,
      customer_email: email,
      success_url: `${process.env.NEXT_PUBLIC_URL}/?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/?canceled=true`,
    });

    return new Response(JSON.stringify({ url: session.url }), { status: 200 });
  } catch (error) {
    console.error('Stripe or other internal error:', error.message);
    return new Response(JSON.stringify({ error: 'Could not create a payment session.' }), { status: 500 });
  }
}