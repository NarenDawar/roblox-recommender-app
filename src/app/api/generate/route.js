import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app'; // Removed 'cert'

// --- ROBUST INITIALIZATION ---
// This automatically finds your credentials using the GOOGLE_APPLICATION_CREDENTIALS env variable
if (!getApps().length) {
  initializeApp();
}
// --- END ---

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

      if (userTier !== 'pro') {
        return new Response(JSON.stringify({ error: 'Permission denied. Pro subscription required.' }), { status: 403 });
      }

      let analysisCount = userData.analysisCount || 0;
      const usageResetDate = userData.usageResetDate?.toDate();
      const monthlyLimit = PLAN_LIMITS[userTier];

      if (usageResetDate && new Date() > usageResetDate) {
        analysisCount = 0;
        const newResetDate = new Date();
        newResetDate.setMonth(newResetDate.getMonth() + 1);
        await userRef.update({ analysisCount: 0, usageResetDate: newResetDate });
      }

      if (analysisCount >= monthlyLimit) {
        return new Response(JSON.stringify({ error: 'Monthly usage limit reached.' }), { status: 429 });
      }
      // --- END CHECK ---

      const { keywords } = await req.json();
      
      const currentTrends = ["'Brainrot' related content", "Anime PvP / Progression Games", "Realistic Simulators", "Minimalist Obbies"];
      const evergreenConcepts = ["Tycoon", "Story Game", "Roleplaying", "Simulator", "Obby", "Minigames", "Fighting"];

      let prompt = `You are an expert Roblox game designer tasked with creating a fresh, new game idea. Your goal is to create a game idea that stays true to what the users wants while incorporating trends or evergreen topics if applicable.`;

      if (keywords) {
        prompt += `\n\nThe idea MUST be inspired by the following user-provided keywords: "${keywords}". Use these keywords as the primary theme.`;
      }

      prompt += `\n\nCurrent Trends to consider: ${currentTrends.join(', ')}
      Evergreen Concepts to consider: ${evergreenConcepts.join(', ')}

      Please generate a single, concise game idea. The idea should be presented in the following format:

      **Title:** [A catchy and descriptive title]
      **Concept:** [A 2-3 sentence summary of the game, explaining how it merges a trend with an evergreen concept, and incorporates the user's keywords if provided.]
      **Core Loop:** [A short, bulleted list describing the main gameplay actions the player will repeat.]

      Do not add any other text or explanation. Just provide the idea in this format.`;

      const openAIResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4-turbo",
          messages: [
            { role: "system", content: "You are an expert Roblox game designer who generates creative and viable game ideas." },
            { role: "user", content: prompt },
          ],
          temperature: 1.2,
          max_tokens: 200,
        }),
      });

      const data = await openAIResponse.json();

      if (data.error) {
        return new Response(JSON.stringify({ error: data.error.message }), { status: 400 });
      }
      
      const newResetDate = new Date();
      newResetDate.setMonth(newResetDate.getMonth() + 1);
      await userRef.update({
        analysisCount: FieldValue.increment(1),
        ...(analysisCount === 0 && { usageResetDate: newResetDate })
      });

      return new Response(JSON.stringify(data), { status: 200 });

    } catch (error) {
      console.error("API Error:", error);
      return new Response(JSON.stringify({ error: 'An internal server error occurred.' }), { status: 500 });
    }
}
