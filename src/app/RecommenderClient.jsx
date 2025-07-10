// app/RecommenderClient.jsx
'use client' // This directive is crucial for a Client Component

import React, { useState, useEffect, useRef } from 'react';

// Fisher-Yates (Knuth) shuffle algorithm
const shuffleArray = (array) => {
  let currentIndex = array.length, randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex !== 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]
    ];
  }
  return array;
};

// MultiSelectDropdown Component
const MultiSelectDropdown = ({ options, selectedOptions, onSelect, limit, label }) => {
  const [isOpen, setIsOpen] = useState(false); // State to control dropdown visibility
  const [searchTerm, setSearchTerm] = useState(''); // State for filtering options
  const dropdownRef = useRef(null); // Ref to detect clicks outside the dropdown

  // Effect to close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter options based on search term
  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle option selection/deselection
  const handleOptionClick = (option) => {
    const isSelected = selectedOptions.includes(option);
    let newSelection;

    if (isSelected) {
      newSelection = selectedOptions.filter(item => item !== option);
    } else {
      if (selectedOptions.length < limit) {
        newSelection = [...selectedOptions, option];
      } else {
        if (limit === 1) {
          newSelection = [option];
        } else {
          console.warn(`Selection limit of ${limit} reached for ${label}.`);
          return;
        }
      }
    }
    onSelect(newSelection);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-gray-700 text-lg font-semibold mb-2">{label}</label>
      <div
        className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800 text-base cursor-pointer flex items-center justify-between transition duration-200 ease-in-out"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        tabIndex="0"
      >
        <div className="flex flex-wrap gap-2">
          {selectedOptions.length > 0 ? (
            selectedOptions.map(option => (
              <span key={option} className="bg-purple-200 text-purple-800 text-sm font-medium px-2.5 py-0.5 rounded-full flex items-center">
                {option}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleOptionClick(option); }}
                  className="ml-1 text-purple-600 hover:text-purple-900 focus:outline-none"
                  aria-label={`Remove ${option}`}
                >
                  &times;
                </button>
              </span>
            ))
          ) : (
            <span className="text-gray-500">Select up to {limit} options...</span>
          )}
        </div>
        <svg className={`w-4 h-4 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </div>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          <input
            type="text"
            className="w-full px-4 py-2 border-b border-gray-200 focus:outline-none text-gray-800"
            placeholder={`Filter ${label.toLowerCase()}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClick={(e) => e.stopPropagation()} // Prevent closing dropdown when typing
            aria-label={`Filter ${label}`}
          />
          <ul role="listbox" className="py-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map(option => (
                <li
                  key={option}
                  className={`px-4 py-2 cursor-pointer hover:bg-gray-100 ${selectedOptions.includes(option) ? 'bg-purple-100 text-purple-800 font-semibold' : 'text-gray-900'}`}
                  onClick={() => handleOptionClick(option)}
                  role="option"
                  aria-selected={selectedOptions.includes(option)}
                >
                  {option}
                </li>
              ))
            ) : (
              <li className="px-4 py-2 text-gray-500">No options found.</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

// HelpModal Component
const HelpModal = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-800 to-indigo-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative transform transition-all duration-300 scale-100 opacity-100">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-2xl font-bold focus:outline-none"
          aria-label="Close help modal"
        >
          &times;
        </button>
        <h2 className="text-3xl font-bold text-purple-700 mb-4 text-center">How to Use This Recommender</h2>
        <div className="text-gray-700 text-base space-y-3">
          <p>This tool helps you discover new Roblox games based on your preferences!</p>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              <strong>Search:</strong> Type a game name, genre, play style, or theme into the search bar to find specific games.
            </li>
            <li>
              <strong>Filter by Preferences:</strong>
              <ul className="list-disc list-inside ml-4">
                <li>Select up to 2 "Preferred Genres" (e.g., Action, Simulation).</li>
                <li>Select up to 2 "Preferred Play Styles" (e.g., Competitive, Casual).</li>
              </ul>
            </li>
            <li>
              <strong>Get Recommendations:</strong>
              <ul className="list-disc list-inside ml-4">
                <li>Click "Get Smart Recommendations" to see games tailored to your selections and/or search.</li>
                <li>Click "Get a Random Game" for a surprise pick from the database (filtered by search if active).</li>
              </ul>
            </li>
            <li>
              <strong>Explore & Play:</strong> All game cards have a "Play On Roblox" link which will open the game on the Roblox site.
            </li>
            <li>
              <strong>Reset:</strong> Use "Clear All Filters & Recommendations" to start fresh.
            </li>
          </ol>
          <p className="mt-4 text-sm text-gray-500 text-center">
            Database updated weekly, last updated July 6th.
          </p>
        </div>
      </div>
    </div>
  );
};

// FutureUpdatesModal Component
const FutureUpdatesModal = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-800 to-indigo-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative transform transition-all duration-300 scale-100 opacity-100">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-2xl font-bold focus:outline-none"
          aria-label="Close future updates modal"
        >
          &times;
        </button>
        <h2 className="text-3xl font-bold text-purple-700 mb-4 text-center">What's Next?</h2>
        <div className="text-gray-700 text-base space-y-3">
          <p>We're always working to improve your experience! Here are some ideas we're exploring for future updates:</p>
          <ul className="list-disc list-inside space-y-2">
            <li>
              <strong>Tiers:</strong> We're looking to add a paid tier with some benefits (no ads, more filters, and access to curated lists!)
            </li>
            <li>
              <strong>Advanced AI Recommendations:</strong> Implement description based recommendations.
            </li>
            <li>
              <strong>Sponsorships:</strong> We'll accept sponsors and promote games directly on the site.
            </li>
          </ul>
          <p className="mt-4 text-sm text-gray-500 text-center">
            Got an idea? Let us know!
          </p>
        </div>
      </div>
    </div>
  );
};


// RecommenderClient is now a Client Component
export default function RecommenderClient({ gamesData, gamesLoadError }) { // Accept gamesLoadError prop
  // State to store selected genres and play styles
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedPlayStyles, setSelectedPlayStyles] = useState([]);
  // State for loading indicator for recommendations
  const [isLoading, setIsLoading] = useState(false);
  // State for error messages
  const [errorMessage, setErrorMessage] = useState('');
  // State to store the recommended games (only the currently displayed ones)
  const [recommendations, setRecommendations] = useState([]);
  // State to store the random game recommendation
  const [randomGameRecommendation, setRandomGameRecommendation] = useState(null);
  // State for search term
  const [searchTerm, setSearchTerm] = useState('');
  // State to control help modal visibility
  const [showHelpModal, setShowHelpModal] = useState(false);
  // State to control Future Updates modal visibility
  const [showFutureUpdatesModal, setShowFutureUpdatesModal] = useState(false);

  // NEW: State to store the full list of scored and sorted games
  const [allSortedRecommendations, setAllSortedRecommendations] = useState([]);
  // NEW: State to track the current page for smart recommendations
  const [currentPage, setCurrentPage] = useState(1);
  const GAMES_PER_PAGE = 5; // How many games to show per page


  // Function to extract unique tags (genres or play styles) from the game data
  const extractUniqueTags = (games, type) => {
    const tags = new Set();
    games.forEach(game => {
      // Ensure game[type] is a string before splitting
      if (typeof game[type] === 'string') {
        const gameTags = game[type].split(',').map(tag => tag.trim());
        gameTags.forEach(tag => tags.add(tag));
      }
    });
    return Array.from(tags).sort();
  };

  // Dynamically get all unique genres and play styles from the fetched game data
  const allAvailableGenres = extractUniqueTags(gamesData, 'genre');
  const allAvailablePlayStyles = extractUniqueTags(gamesData, 'playStyle');

  // Function to generate recommendations based on user input
  const generateRecommendations = async () => {
    setIsLoading(true);
    setErrorMessage('');
    setRecommendations([]);
    setRandomGameRecommendation(null); // Clear random game when generating specific recs
    setAllSortedRecommendations([]); // Clear previous full list
    setCurrentPage(1); // Reset to first page

    try {
      // Adjusted validation: require at least one genre or play style selected, or a search term
      if (selectedGenres.length === 0 && selectedPlayStyles.length === 0 && !searchTerm.trim()) {
        setErrorMessage("Please select at least one preferred genre or play style, or enter a search term to get recommendations.");
        setIsLoading(false);
        return;
      }

      // Filter games by search term first
      const lowerSearchTerm = searchTerm.toLowerCase().trim();
      const searchedGames = gamesData.filter(game =>
        game.name.toLowerCase().includes(lowerSearchTerm) ||
        game.genre.toLowerCase().includes(lowerSearchTerm) ||
        game.playStyle.toLowerCase().includes(lowerSearchTerm) ||
        (game.theme && game.theme.toLowerCase().includes(lowerSearchTerm))
      );

      const scoredGames = searchedGames.map(game => {
        let score = 0;
        const gameGenres = typeof game.genre === 'string' ? game.genre.toLowerCase().split(',').map(g => g.trim()) : [];
        const gamePlayStyles = typeof game.playStyle === 'string' ? game.playStyle.toLowerCase().split(',').map(s => s.trim()) : [];
        const gameThemes = typeof game.theme === 'string' ? game.theme.toLowerCase().split(',').map(t => t.trim()) : [];

        // Score based on genre matches
        selectedGenres.forEach(selectedGenre => {
          const lowerSelectedGenre = selectedGenre.toLowerCase();
          if (gameGenres.some(g => g.includes(lowerSelectedGenre))) {
            score += 10;
          }
        });

        // Score based on play style matches
        selectedPlayStyles.forEach(selectedPlayStyle => {
          const lowerSelectedPlayStyle = selectedPlayStyle.toLowerCase();
          if (gamePlayStyles.some(s => s.includes(lowerSelectedPlayStyle))) {
            score += 8;
          }
        });

        // Add score for theme matches (if theme filter was present, or for general relevance)
        // This part of scoring is now more general, as theme filter is removed from UI.
        // If the game's theme contains the search term, add a bonus.
        if (game.theme && lowerSearchTerm && game.theme.toLowerCase().includes(lowerSearchTerm)) {
             score += 5; // Small bonus if search term matches theme
        }

        // Ensure a game that was found by the initial `searchedGames` filter
        // or by any dropdown filter gets at least a score of 1 to be included in recommendations.
        // This is crucial for search-only results.
        if (score > 0 || (lowerSearchTerm && (game.name.toLowerCase().includes(lowerSearchTerm) ||
                                              game.genre.toLowerCase().includes(lowerSearchTerm) ||
                                              game.playStyle.toLowerCase().includes(lowerSearchTerm) ||
                                              (game.theme && game.theme.toLowerCase().includes(lowerSearchTerm))))) {
            score = Math.max(score, 1); // Ensure minimum score of 1 if any criteria met
        }

        return { ...game, score };
      });

      const sortedGames = scoredGames.sort((a, b) => b.score - a.score);
      const filteredSortedGames = sortedGames.filter(game => game.score > 0); // All relevant games

      // --- APPLY SHUFFLE HERE ---
      const shuffledFilteredSortedGames = shuffleArray([...filteredSortedGames]); // Create a shallow copy before shuffling

      setAllSortedRecommendations(shuffledFilteredSortedGames); // Store the full shuffled list
      setRecommendations(shuffledFilteredSortedGames.slice(0, GAMES_PER_PAGE)); // Display initial page
      setCurrentPage(1); // Set current page to 1

      if (shuffledFilteredSortedGames.length === 0) {
        setErrorMessage("No games found matching your preferences or search term. Try different selections!");
      }
    } catch (error) {
      console.error('Error generating recommendations:', error);
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // NEW: Pagination functions
  const goToNextPage = () => {
    setIsLoading(true);
    setErrorMessage('');
    setRandomGameRecommendation(null); // Clear random game
    setTimeout(() => { // Simulate loading for transition
      const nextPage = currentPage + 1;
      const startIndex = (nextPage - 1) * GAMES_PER_PAGE;
      setRecommendations(allSortedRecommendations.slice(startIndex, startIndex + GAMES_PER_PAGE));
      setCurrentPage(nextPage);
      setIsLoading(false);
    }, 500); // Half second delay for fade
  };

  const goToPreviousPage = () => {
    setIsLoading(true);
    setErrorMessage('');
    setRandomGameRecommendation(null); // Clear random game
    setTimeout(() => { // Simulate loading for transition
      const prevPage = currentPage - 1;
      const startIndex = (prevPage - 1) * GAMES_PER_PAGE;
      setRecommendations(allSortedRecommendations.slice(startIndex, startIndex + GAMES_PER_PAGE));
      setCurrentPage(prevPage);
      setIsLoading(false);
    }, 500); // Half second delay for fade
  };


  // Function to get a random game recommendation
  const generateRandomRecommendation = async () => {
    setIsLoading(true);
    setErrorMessage('');
    setRecommendations([]); // Clear specific recommendations
    setRandomGameRecommendation(null); // Clear previous random game
    setAllSortedRecommendations([]); // Clear full sorted list
    setCurrentPage(1); // Reset page

    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay

    try {
      // Filter games by search term before picking random
      const lowerSearchTerm = searchTerm.toLowerCase().trim();
      let gamesToPickFrom = gamesData.filter(game =>
        game.name.toLowerCase().includes(lowerSearchTerm) ||
        game.genre.toLowerCase().includes(lowerSearchTerm) ||
        game.playStyle.toLowerCase().includes(lowerSearchTerm) ||
        (game.theme && game.theme.toLowerCase().includes(lowerSearchTerm))
      );

      // --- SHUFFLE FOR RANDOM PICK TOO (Optional, but good for true randomness) ---
      gamesToPickFrom = shuffleArray([...gamesToPickFrom]); // Shuffle the filtered list for random pick

      if (gamesToPickFrom.length === 0) {
        setErrorMessage("No games found matching your search term to pick a random game.");
        setIsLoading(false);
        return;
      }
      const randomIndex = Math.floor(Math.random() * gamesToPickFrom.length);
      setRandomGameRecommendation(gamesToPickFrom[randomIndex]);
    } catch (error) {
      console.error('Error generating random recommendation:', error);
      setErrorMessage('An unexpected error occurred while picking a random game.');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to clear all selected filters and search term
  const clearAllFilters = () => {
    setSelectedGenres([]);
    setSelectedPlayStyles([]);
    setSearchTerm(''); // Clear search term
    setErrorMessage('');
    setRecommendations([]);
    setRandomGameRecommendation(null);
    setAllSortedRecommendations([]); // Clear full sorted list
    setCurrentPage(1); // Reset page
  };

  // Functions to open and close the help modal
  const openHelpModal = () => setShowHelpModal(true);
  const closeHelpModal = () => setShowHelpModal(false);

  // Functions to open and close the Future Updates modal
  const openFutureUpdatesModal = () => setShowFutureUpdatesModal(true);
  const closeFutureUpdatesModal = () => setShowFutureUpdatesModal(false);


  // Render error state if games data failed to load in the Server Component
  if (gamesLoadError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-indigo-800 flex items-center justify-center p-4 font-sans antialiased">
        <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-2xl text-center">
          <p className="text-red-700 text-xl">{gamesLoadError}</p>
          <p className="mt-2 text-gray-600">Please check your Firebase setup and environment variables.</p>
        </div>
      </div>
    );
  }

  // Calculate total pages for smart recommendations
  const totalPages = Math.ceil(allSortedRecommendations.length / GAMES_PER_PAGE);


  // Render the main UI
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-indigo-800 flex items-center justify-center p-4 font-sans antialiased">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-2xl transform transition-all duration-300 hover:scale-[1.01]">
        <h1 className="text-4xl font-extrabold text-center text-gray-900 mb-6 tracking-tight">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-red-500">
            RBXDiscover: A Roblox Game Recommender
          </span> 🎮
        </h1>

        <p className="text-center text-gray-600 mb-4 text-lg">
          Discover your next favorite Roblox game! Select your preferences below or search directly.
          <br className="hidden sm:inline" /> {/* Line break for smaller screens */}
          <span className="text-sm text-gray-500">Database updated weekly, last updated July 6th.</span>
        </p>

        {/* How to Use Button */}
        <div className="text-center mb-4">
          <button
            onClick={openHelpModal}
            className="text-purple-600 hover:text-purple-800 text-base font-medium focus:outline-none transition duration-200 ease-in-out cursor-pointer"
          >
            How to Use This Website?
          </button>
        </div>

        {/* Future Updates Button */}
        <div className="text-center mb-8">
          <button
            onClick={openFutureUpdatesModal}
            className="text-blue-600 hover:text-blue-800 text-base font-medium focus:outline-none transition duration-200 ease-in-out cursor-pointer"
          >
            Future Updates
          </button>
        </div>


        {/* Search Bar */}
        <div className="mb-6">
          <label htmlFor="gameSearch" className="block text-gray-700 text-lg font-semibold mb-2">
            Search for a game by name, genre, or style:
          </label>
          <input
            type="text"
            id="gameSearch"
            className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800 text-base transition duration-200 ease-in-out"
            placeholder="e.g., Adopt Me, horror, PvP"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search for games"
          />
        </div>


        <div className="mb-6">
          <MultiSelectDropdown
            label="Preferred Genres"
            options={allAvailableGenres}
            selectedOptions={selectedGenres}
            onSelect={setSelectedGenres}
            limit={2}
          />
        </div>

        <div className="mb-8">
          <MultiSelectDropdown
            label="Preferred Play Styles"
            options={allAvailablePlayStyles}
            selectedOptions={selectedPlayStyles}
            onSelect={setSelectedPlayStyles}
            limit={2}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <button
            onClick={generateRecommendations}
            // Adjusted disabled condition to include search term
            disabled={isLoading || (selectedGenres.length === 0 && selectedPlayStyles.length === 0 && !searchTerm.trim())}
            className={`flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition duration-300 ease-in-out text-xl transform hover:scale-105 ${isLoading || (selectedGenres.length === 0 && selectedPlayStyles.length === 0 && !searchTerm.trim()) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            aria-live="polite"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Recommending...
              </span>
            ) : (
              'Get Smart Recommendations'
            )}
          </button>

          {/* Get a Random Game Button */}
          <button
            onClick={generateRandomRecommendation}
            disabled={isLoading || gamesData.length === 0}
            className={`flex-1 bg-gradient-to-r from-green-500 to-teal-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:from-green-600 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-300 ease-in-out text-xl transform hover:scale-105 ${isLoading || gamesData.length === 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            aria-live="polite"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Picking Random...
              </span>
            ) : (
              'Get a Random Game'
            )}
          </button>
        </div>

        {/* Clear All Filters Button */}
        {(selectedGenres.length > 0 || selectedPlayStyles.length > 0 || searchTerm.trim() || recommendations.length > 0 || randomGameRecommendation) && (
          <div className="text-center mt-4">
            <button
              onClick={clearAllFilters}
              className="text-gray-500 hover:text-gray-800 text-sm font-medium focus:outline-none transition duration-200 ease-in-out cursor-pointer"
            >
              Clear All Filters & Recommendations
            </button>
          </div>
        )}


        {errorMessage && (
          <div className="mt-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg text-center text-base" role="alert">
            {errorMessage}
          </div>
        )}

        {/* Display Random Game Recommendation */}
        {randomGameRecommendation && (
          <div className="mt-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-5 text-center">
              Your Random Pick:
            </h2>
            <div className="space-y-4">
              <div // Changed from <a> to <div>
                key={randomGameRecommendation.id}
                className="block bg-purple-50 p-5 rounded-lg shadow-md border border-purple-200 hover:border-purple-400 transition duration-200 ease-in-out transform hover:-translate-y-1" // Removed cursor-pointer
              >
                <h3 className="text-xl font-semibold text-purple-700 mb-1">{randomGameRecommendation.name}</h3>
                <p className="text-gray-700 text-sm">
                  <span className="font-medium">Genre:</span> {randomGameRecommendation.genre}
                </p>
                <p className="text-gray-700 text-sm">
                  <span className="font-medium">Play Style:</span> {randomGameRecommendation.playStyle}
                </p>
                {randomGameRecommendation.theme && (
                  <p className="text-gray-700 text-sm">
                    <span className="font-medium">Theme:</span> {randomGameRecommendation.theme}
                  </p>
                )}
                {randomGameRecommendation.link && (
                  <a
                    href={randomGameRecommendation.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-block bg-blue-500 text-white font-bold py-2 px-4 rounded-lg shadow hover:bg-blue-600 transition duration-200 ease-in-out text-sm cursor-pointer"
                  >
                    Play on Roblox
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Display Smart Recommendations */}
        {recommendations.length > 0 && (
          <div className="mt-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-5 text-center">
              Your Top Smart Recommendations:
            </h2>
            <div className="space-y-4">
              {recommendations.map((game) => (
                <div // Changed from <a> to <div>
                  key={game.id}
                  className="block bg-purple-50 p-5 rounded-lg shadow-md border border-purple-200 hover:border-purple-400 transition duration-200 ease-in-out transform hover:-translate-y-1" // Removed cursor-pointer
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
                </div>
              ))}
            </div>
            {/* Pagination Controls */}
            {allSortedRecommendations.length > GAMES_PER_PAGE && (
              <div className="flex justify-center items-center gap-4 mt-6">
                <button
                  onClick={goToPreviousPage}
                  disabled={isLoading || currentPage === 1}
                  className={`bg-purple-500 text-white font-bold py-2 px-4 rounded-lg shadow hover:bg-purple-600 transition duration-200 ease-in-out text-base transform hover:scale-105 ${isLoading || currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                <span className="text-gray-700 text-base font-medium">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={goToNextPage}
                  disabled={isLoading || currentPage === totalPages}
                  className={`bg-purple-500 text-white font-bold py-2 px-4 rounded-lg shadow hover:bg-purple-600 transition duration-200 ease-in-out text-base transform hover:scale-105 ${isLoading || currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {showHelpModal && <HelpModal onClose={closeHelpModal} />}
      {showFutureUpdatesModal && <FutureUpdatesModal onClose={closeFutureUpdatesModal} />}
    </div>
  );
}