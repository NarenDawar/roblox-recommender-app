// components/FavoritesPage.jsx
'use client';

import React from 'react';

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
        favoriteGames.length > 0 ? (
          <div className="space-y-4">
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
          <p className="text-center text-gray-500 text-lg">
            You haven't favorited any games yet. Start exploring and add some!
          </p>
        )
      ) : (
        <p className="text-center text-gray-500 text-lg">
          Log in to save and view your favorite games.
        </p>
      )}
    </div>
  );
};

export default FavoritesPage;
