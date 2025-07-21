// components/CuratedListsPage.jsx
'use client';

import React from 'react';

const CuratedListsPage = ({ user, gamesData, onBackToHome }) => {
  // In a real application, you would fetch curated lists from your database
  // For demonstration, let's create a couple of mock lists.
  // You would typically have a 'lists' collection in Firestore,
  // where each document is a list with a name, description, and an array of game IDs.

  const mockCuratedLists = [
    {
      id: 'list1',
      name: 'Top Horror Games',
      description: 'Some games to play solo or with friends for a faster heart rate!',
      gameIds: [76,90,168], // Replace with actual game IDs from your gamesData
    },
    {
      id: 'list2',
      name: 'Games To Play With Friends',
      description: 'Some games that are fun with your friends!',
      gameIds: [40,78,160, 162], // Replace with actual game IDs
    },
    // Add more lists as needed
  ];

  // Function to find game details from gamesData based on gameId
  const getGameDetails = (gameId) => {
    return gamesData.find(game => game.id === gameId);
  };

  return (
    <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-2xl transform transition-all duration-300">
      <h2 className="text-4xl font-extrabold text-center text-gray-900 mb-6 tracking-tight">
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-500 to-cyan-500">
          Curated Lists
        </span> ✨
      </h2>

      <p className="text-center text-gray-600 mb-8 text-lg">
        Explore weekly hand-picked game collections by the RBXDiscover team!
      </p>

      <div className="text-center mb-8">
      </div>

      {user ? (
        mockCuratedLists.length > 0 ? (
          <div className="space-y-8">
            {mockCuratedLists.map((list) => (
              <div key={list.id} className="bg-blue-50 p-6 rounded-lg shadow-md border border-blue-200">
                <h3 className="text-2xl font-bold text-blue-700 mb-2">{list.name}</h3>
                <p className="text-gray-700 mb-4">{list.description}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {list.gameIds.map(gameId => {
                    const game = getGameDetails(gameId);
                    return game ? (
                      <div key={game.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                        <h4 className="text-lg font-semibold text-gray-800">{game.name}</h4>
                        <p className="text-gray-600 text-sm">
                          <strong>Genre:</strong> {game.genre}
                        </p>
                        <p className="text-gray-600 text-sm">
                          <strong>Play Style:</strong> {game.playStyle}
                        </p>
                        {game.link && (
                          <a
                            href={game.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-block text-blue-500 hover:underline text-sm"
                          >
                            Play on Roblox
                          </a>
                        )}
                      </div>
                    ) : (
                      <p key={gameId} className="text-red-500 text-sm">Game not found: {gameId}</p>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 text-lg">
            No curated lists available at the moment. Check back soon!
          </p>
        )
      ) : (
        <p className="text-center text-gray-500 text-lg">
          Log in to view curated game lists.
        </p>
      )}
    </div>
  );
};

export default CuratedListsPage;
