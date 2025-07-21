// components/FavoritesPage.jsx
'use client';

import React, { useState, useEffect } from 'react';

// Reusing the GameCard component structure for consistency
// Note: This GameCard is a local copy for demonstration. In a real app,
// you'd typically import a shared GameCard component.
const GameCard = ({ game, toggleFavorite, isFavorite }) => {
  return (
    <div
      key={game.id}
      className="block bg-purple-50 p-5 rounded-lg shadow-md border border-purple-200 hover:border-purple-400 transition duration-200 ease-in-out transform hover:-translate-y-1 relative"
    >
      <h3 className="text-xl font-semibold text-purple-700 mb-1">{game.name}</h3>
      <p className="text-gray-700 text-sm">
        <span className="font-medium">Genre:</span> {game.genre}
      </p>
      <p className="text-gray-700 text-sm">
        <span className="font-medium">Play Style:</span> {game.playStyle}
      </p>
      {game.theme && (
        <p className="text-gray-700 text-sm">
          <span className="font-medium">Theme:</span> {game.theme}
        </p>
      )}
      {game.link && (
        <a
          href={game.link}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block bg-blue-500 text-white font-bold py-2 px-4 rounded-lg shadow hover:bg-blue-600 transition duration-200 ease-in-out text-sm cursor-pointer"
        >
          Play on Roblox
        </a>
      )}
      {/* Favorite Button/Icon */}
      <button
        onClick={(e) => {
          e.stopPropagation(); // Prevent card click from triggering
          toggleFavorite(game.id);
        }}
        className={`absolute top-3 right-3 p-2 rounded-full transition-colors duration-200
          ${isFavorite ? 'text-red-500 hover:text-red-600' : 'text-gray-400 hover:text-red-400'}`}
        aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 fill-current"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
          fill={isFavorite ? "currentColor" : "none"} // Fill if favorited
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 22.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
      </button>
    </div>
  );
};


const FavoritesPage = ({ user, gamesData, favoritedGameIds, toggleFavorite, onBackToHome }) => {
  // Filter gamesData to get only the favorited games
  const favoriteGames = gamesData.filter(game => favoritedGameIds.includes(game.id));

  const [recommendedGames, setRecommendedGames] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [recommendationError, setRecommendationError] = useState('');

  // Function to extract top genres/playstyles from favorited games
  const extractTopPreferences = (games, type) => {
    const counts = {};
    games.forEach(game => {
      if (game[type]) {
        const items = game[type].split(',').map(item => item.trim());
        items.forEach(item => {
          counts[item] = (counts[item] || 0) + 1;
        });
      }
    });

    // Sort by count descending and return top 2
    return Object.keys(counts)
      .sort((a, b) => counts[b] - counts[a])
      .slice(0, 2); // Limit to top 2 preferences
  };

  // Function to fetch recommendations based on favorited games
  useEffect(() => {
    const fetchRecommendationsBasedOnFavorites = async () => {
      // Re-filter favoriteGames inside useEffect to ensure it uses the latest favoritedGameIds
      const currentFavoriteGames = gamesData.filter(game => favoritedGameIds.includes(game.id));

      if (!user || currentFavoriteGames.length === 0) {
        setRecommendedGames([]);
        setRecommendationError('');
        return;
      }

      setLoadingRecommendations(true);
      setRecommendationError('');

      try {
        const preferredGenres = extractTopPreferences(currentFavoriteGames, 'genre');
        const preferredPlayStyles = extractTopPreferences(currentFavoriteGames, 'playStyle');

        if (preferredGenres.length === 0 && preferredPlayStyles.length === 0) {
          setRecommendationError("No genres or play styles found in your favorited games to generate recommendations.");
          setLoadingRecommendations(false);
          return;
        }

        const response = await fetch('/api/recommendations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            selectedGenres: preferredGenres,
            selectedPlayStyles: preferredPlayStyles,
            searchTerm: '', // No specific search term for this type of recommendation
            isRandom: false,
            page: 1, // Always fetch the first page of recommendations
            limit: 5, // Limit to 5 recommendations
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.errorMessage || 'Failed to fetch recommendations.');
        }

        if (result.errorMessage) {
          setRecommendationError(result.errorMessage);
          setRecommendedGames([]);
        } else {
          // Filter out games that are already in the user's favorites
          const newRecommendations = result.recommendations.filter(
            game => !favoritedGameIds.includes(game.id)
          );
          // Add isFavorite flag for consistency
          const recommendationsWithFavorites = newRecommendations.map(game => ({
            ...game,
            isFavorite: favoritedGameIds.includes(game.id)
          }));
          setRecommendedGames(recommendationsWithFavorites);
        }
      } catch (error) {
        console.error("Error fetching recommendations based on favorites:", error);
        setRecommendationError(error.message || "Failed to load recommendations.");
        setRecommendedGames([]);
      } finally {
        setLoadingRecommendations(false);
      }
    };

    fetchRecommendationsBasedOnFavorites();
  }, [user, gamesData, favoritedGameIds]); // Dependency array: user, gamesData, and favoritedGameIds
    // Removed 'favoriteGames' from dependencies to prevent infinite loop.
    // 'gamesData' is a stable prop from the server component.

  return (
    <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-2xl transform transition-all duration-300">
      <h2 className="text-4xl font-extrabold text-center text-gray-900 mb-6 tracking-tight">
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-green-500">
          Your Favorite Games
        </span> ❤️
      </h2>

      <p className="text-center text-gray-600 mb-8 text-lg">
        {user ? `Games favorited by ${user.displayName || user.email}.` : "Please log in to see your favorites."}
      </p>

      <div className="text-center mb-8">
        <button
          onClick={onBackToHome}
          className="bg-purple-500 text-white font-bold py-2 px-4 rounded-lg shadow hover:bg-purple-600 transition duration-200 ease-in-out text-base transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-white cursor-pointer"
        >
          ← Back to Recommender
        </button>
      </div>

      {user ? (
        <>
          {favoriteGames.length > 0 ? (
            <div className="space-y-4 mb-12"> {/* Added mb-12 for spacing before new section */}
              {favoriteGames.map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  toggleFavorite={toggleFavorite}
                  isFavorite={true} // Always true for games on this page
                />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 text-lg mb-12">
              You haven't favorited any games yet. Start exploring and add some!
            </p>
          )}

          {/* Games You May Like Section */}
          <div className="mt-8 pt-8 border-t-2 border-gray-200"> {/* Added border-top for separation */}
            <h3 className="text-3xl font-extrabold text-center text-gray-900 mb-6 tracking-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-red-500">
                Games You May Like
              </span> ✨
            </h3>
            {loadingRecommendations ? (
              <p className="text-center text-gray-600 text-lg flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-purple-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Finding recommendations...
              </p>
            ) : recommendationError ? (
              <p className="text-center text-red-500 text-lg">{recommendationError}</p>
            ) : recommendedGames.length > 0 ? (
              <div className="space-y-4">
                {recommendedGames.map((game) => (
                  <GameCard
                    key={game.id}
                    game={game}
                    toggleFavorite={toggleFavorite}
                    isFavorite={favoritedGameIds.includes(game.id)} // Check if this recommended game is already favorited
                  />
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 text-lg">
                No new recommendations based on your favorites. Try favoriting more games!
              </p>
            )}
          </div>
        </>
      ) : (
        <p className="text-center text-gray-500 text-lg">
          Log in to save and view your favorite games, and get personalized recommendations!
        </p>
      )}
    </div>
  );
};

export default FavoritesPage;
