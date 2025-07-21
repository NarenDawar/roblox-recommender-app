// app/api/recommendations/route.js
// This API route handles the server-side logic for generating game recommendations.

// Import Firebase Admin SDK for server-side data access.
// Ensure your Firebase Admin SDK environment variables are correctly set for this to work.
import { initializeApp as initializeAdminApp } from 'firebase-admin/app';
import admin from "firebase-admin";
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';
import { credential } from 'firebase-admin';

// Configuration for Firebase Admin SDK.
// The privateKey requires special handling to replace escaped newlines.
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

// Initialize Firebase Admin app if it hasn't been initialized already.
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountConfig),
  });
}
// Get a Firestore instance for admin operations.
const dbAdmin = getAdminFirestore();

// Fisher-Yates (Knuth) shuffle algorithm.
// This is used to randomize the order of recommendations after scoring.
const shuffleArray = (array) => {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]
    ];
  }
  return array;
};

/**
 * Handles POST requests to generate game recommendations or a random game.
 * @param {Request} request The incoming request object.
 * @returns {Response} A JSON response containing recommendations and total count, or an error message.
 */
export async function POST(request) {
  try {
    // Parse the request body to get filters and flags.
    const {
      selectedGenres,
      selectedPlayStyles,
      searchTerm,
      isRandom, // Flag to indicate if a random game is requested
      page,     // Current page for pagination
      limit     // Number of games per page
    } = await request.json();

    // Fetch all games from Firestore.
    // In a very large dataset scenario, you might optimize this to fetch only relevant data
    // using Firestore queries if your filtering criteria align with Firestore's indexing capabilities.
    const querySnapshot = await dbAdmin.collection('robloxGames').get();
    let gamesData = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Handle request for a single random game.
    if (isRandom) {
      const lowerSearchTerm = searchTerm.toLowerCase().trim();
      // Filter games based on search term for random selection.
      let gamesToPickFrom = gamesData.filter(game =>
        game.name.toLowerCase().includes(lowerSearchTerm) ||
        game.genre.toLowerCase().includes(lowerSearchTerm) ||
        game.playStyle.toLowerCase().includes(lowerSearchTerm) ||
        (game.theme && game.theme.toLowerCase().includes(lowerSearchTerm))
      );

      // Shuffle the filtered games to ensure true randomness.
      gamesToPickFrom = shuffleArray([...gamesToPickFrom]);

      // If no games match the search term for random pick, return an error.
      if (gamesToPickFrom.length === 0) {
        return new Response(JSON.stringify({ recommendations: [], totalCount: 0, errorMessage: "No games found matching your search term to pick a random game." }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      // Select a random game.
      const randomIndex = Math.floor(Math.random() * gamesToPickFrom.length);
      // Return the single random game.
      return new Response(JSON.stringify({ recommendations: [gamesToPickFrom[randomIndex]], totalCount: 1 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });

    } else {
      // Handle smart recommendations based on preferences and search term.
      const lowerSearchTerm = searchTerm.toLowerCase().trim();
      // Filter games by search term first.
      const searchedGames = gamesData.filter(game =>
        game.name.toLowerCase().includes(lowerSearchTerm) ||
        game.genre.toLowerCase().includes(lowerSearchTerm) ||
        game.playStyle.toLowerCase().includes(lowerSearchTerm) ||
        (game.theme && game.theme.toLowerCase().includes(lowerSearchTerm))
      );

      // Score each game based on selected genres, play styles, and search term.
      const scoredGames = searchedGames.map(game => {
        let score = 0;
        const gameGenres = typeof game.genre === 'string' ? game.genre.toLowerCase().split(',').map(g => g.trim()) : [];
        const gamePlayStyles = typeof game.playStyle === 'string' ? game.playStyle.toLowerCase().split(',').map(s => s.trim()) : [];
        const gameThemes = typeof game.theme === 'string' ? game.theme.toLowerCase().split(',').map(t => t.trim()) : [];

        // Add score for matching genres.
        selectedGenres.forEach(selectedGenre => {
          const lowerSelectedGenre = selectedGenre.toLowerCase();
          if (gameGenres.some(g => g.includes(lowerSelectedGenre))) {
            score += 10;
          }
        });

        // Add score for matching play styles.
        selectedPlayStyles.forEach(selectedPlayStyle => {
          const lowerSelectedPlayStyle = selectedPlayStyle.toLowerCase();
          if (gamePlayStyles.some(s => s.includes(lowerSelectedPlayStyle))) {
            score += 8;
          }
        });

        // Add score if theme matches search term.
        if (game.theme && lowerSearchTerm && game.theme.toLowerCase().includes(lowerSearchTerm)) {
             score += 5;
        }

        // Ensure a minimum score if any filter or search term applies.
        if (score > 0 || (lowerSearchTerm && (game.name.toLowerCase().includes(lowerSearchTerm) ||
                                              game.genre.toLowerCase().includes(lowerSearchTerm) ||
                                              game.playStyle.toLowerCase().includes(lowerSearchTerm) ||
                                              (game.theme && game.theme.toLowerCase().includes(lowerSearchTerm))))) {
            score = Math.max(score, 1);
        }

        return { ...game, score };
      });

      // Sort games by score in descending order.
      const sortedGames = scoredGames.sort((a, b) => b.score - a.score);
      // Filter out games with a score of 0 (no match).
      const filteredSortedGames = sortedGames.filter(game => game.score > 0);

      // Shuffle the final sorted list to add some variety.
      const shuffledFilteredSortedGames = shuffleArray([...filteredSortedGames]);

      // Calculate total count for pagination.
      const totalCount = shuffledFilteredSortedGames.length;
      // Determine the start index for pagination.
      const startIndex = (page - 1) * limit;
      // Slice the array to get recommendations for the current page.
      const paginatedRecommendations = shuffledFilteredSortedGames.slice(startIndex, startIndex + limit);

      // If no games are found after filtering, return an appropriate message.
      if (paginatedRecommendations.length === 0 && totalCount === 0) {
        return new Response(JSON.stringify({ recommendations: [], totalCount: 0, errorMessage: "No games found matching your preferences or search term. Try different selections!" }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Return the paginated recommendations and total count.
      return new Response(JSON.stringify({ recommendations: paginatedRecommendations, totalCount }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    // Log any errors and return a 500 internal server error response.
    console.error("Error in recommendations API:", error);
    return new Response(JSON.stringify({ errorMessage: "An internal server error occurred." }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
