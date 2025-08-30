import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
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

const PLAN_LIMITS = {
  free: 5,
  pro: 50,
};

export async function POST(req) {
    try {
      // --- SECURITY & USAGE CHECK ---
      const authorization = req.headers.get('authorization');
      if (!authorization?.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
      }

      const token = authorization.split('Bearer ')[1];
      const { uid } = await auth.verifyIdToken(token);
      
      const userRef = db.collection('users').doc(uid);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        return new Response(JSON.stringify({ error: 'User not found.' }), { status: 404 });
      }

      const userData = userDoc.data();
      const userTier = userData.tier || 'free';
      let analysisCount = userData.analysisCount || 0;
      const usageResetDate = userData.usageResetDate?.toDate();
      const monthlyLimit = PLAN_LIMITS[userTier] || 5;

      // Check if the usage period has expired
      if (usageResetDate && new Date() > usageResetDate) {
        analysisCount = 0; // Reset the count
        const newResetDate = new Date();
        newResetDate.setMonth(newResetDate.getMonth() + 1);
        await userRef.update({ analysisCount: 0, usageResetDate: newResetDate });
      }

      // Enforce the limit
      if (analysisCount >= monthlyLimit) {
        return new Response(JSON.stringify({ error: 'Monthly analysis limit reached.' }), { status: 429 });
      }
      // --- END CHECK ---

      const { idea } = await req.json();
      const currentTrends = ["Build A __ , Steal A ____, & Grow a ____ Games", "'Brainrot' related content", "Anime PvP / Progression Games"];
      const prompt = `Analyze the following Roblox game idea based on a comprehensive set of criteria.

      Your analysis MUST include:
      - Core metrics: Scores (out of 10) for Virality Potential, Originality, and Monetizability, each with a 1 sentence justification.
      - Core elements: Pros, cons, and actionable improvements.
      - Business strategy: Potential monetization and promotion strategies (consider where they could find their ideal audience).
      - Deeper analysis: A breakdown of the target audience, alignment with current Roblox trends (like ${currentTrends.join(', ')}), a comparative analysis against 2 successful related games to identify key takeaways, and design ideas for game thumbnail/icon, title, and pictures.
       Game Idea: "${idea}"`; // Your full prompt here

      // Call OpenAI API (omitted for brevity)
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-5-nano", 
          messages: [
            {
              role: "system",
              content:
                `You are an AI assistant specialized in analyzing Roblox game ideas. You provide a detailed, helpful, and constructive analysis in Markdown format.
                You must output your response in the following EXACT Markdown structure.
                **Crucially, you must place a blank line before each heading.** Each heading (e.g., **Pros**, **Cons**) must start on its own new line.

                **Virality Potential**
                Score: [number]/10
                [Short explanation]

                **Originality**
                Score: [number]/10
                [Short explanation]

                **Monetizability**
                Score: [number]/10
                [Short explanation]

                **Pros**
                - Point 1

                **Cons**
                - Point 1

                **Improvements**
                - Point 1

                **Monetization Strategy**
                - Point 1

                **Promotion Strategies**
                - Point 1

                **Target Audience**
                - Point 1

                **Trend Alignment**
                - Point 1

                **Comparative Analysis**
                - Point 1

                **Creative Assets**
                - Point 1

                Do not add any other sections or headings. Keep exactly these twelve headings in this order.
                `,
            },
            { role: "user", content: prompt },
          ],
          temperature: 1, 
        }),
      });
      const data = await response.json();

      if (data.error) {
        return new Response(JSON.stringify({ error: data.error.message }), { status: 400 });
      }

      // --- INCREMENT USAGE COUNT ---
      // If the API call was successful, increment the user's count
      const newResetDate = new Date();
      newResetDate.setMonth(newResetDate.getMonth() + 1);
      
      await userRef.update({
        analysisCount: FieldValue.increment(1),
        // Set the reset date on the first analysis of the period
        ...(analysisCount === 0 && { usageResetDate: newResetDate })
      });

      return new Response(JSON.stringify(data), { status: 200 });

    } catch (error) {
      console.error("API Error:", error);
      return new Response(JSON.stringify({ error: 'An internal server error occurred.' }), { status: 500 });
    }
}
