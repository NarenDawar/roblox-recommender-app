// app/RecommenderClient.jsx
'use client' // This directive is crucial for a Client Component

import React, { useState, useEffect, useRef } from 'react';
// Removed client-side Firebase imports, as data is passed as prop

// MultiSelectDropdown Component
// This component handles rendering a dropdown with filterable options,
// allowing multiple selections up to a specified limit.
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
      // Deselect option
      newSelection = selectedOptions.filter(item => item !== option);
    } else {
      // Select option, if limit is not reached
      if (selectedOptions.length < limit) {
        newSelection = [...selectedOptions, option];
      } else {
        // If limit is 1, selecting a new option replaces the old one
        if (limit === 1) {
          newSelection = [option];
        } else {
          console.warn(`Selection limit of ${limit} reached for ${label}.`);
          return; // Do not update selection if limit is hit for multi-select
        }
      }
    }
    onSelect(newSelection); // Call the parent's selection handler
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


// RecommenderClient is now a Client Component
export default function RecommenderClient({ gamesData, gamesLoadError }) { // Accept gamesLoadError prop
  // State to store selected genres and play styles
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedPlayStyles, setSelectedPlayStyles] = useState([]);
  // NEW: State to store selected theme
  const [selectedTheme, setSelectedTheme] = useState([]); // Limit 1, so it will be an array of 0 or 1 item
  // State for loading indicator for recommendations
  const [isLoading, setIsLoading] = useState(false);
  // State for error messages
  const [errorMessage, setErrorMessage] = useState('');
  // State to store the recommended games
  const [recommendations, setRecommendations] = useState([]);
  // NEW: State to store the random game recommendation
  const [randomGameRecommendation, setRandomGameRecommendation] = useState(null);


  // Function to extract unique tags (genres or play styles or themes) from the game data
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

  // Dynamically get all unique genres, play styles, and themes from the fetched game data
  const allAvailableGenres = extractUniqueTags(gamesData, 'genre');
  const allAvailablePlayStyles = extractUniqueTags(gamesData, 'playStyle');
  const allAvailableThemes = extractUniqueTags(gamesData, 'theme'); // NEW: For themes

  // Function to generate recommendations based on user input
  const generateRecommendations = async () => {
    setIsLoading(true);
    setErrorMessage('');
    setRecommendations([]);
    setRandomGameRecommendation(null); // Clear random game when generating specific recs

    // Simulate API call delay for recommendation generation
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      if (selectedGenres.length === 0 && selectedPlayStyles.length === 0 && selectedTheme.length === 0) {
        setErrorMessage("Please select at least one preferred genre, play style, or theme to get recommendations.");
        setIsLoading(false);
        return;
      }

      const scoredGames = gamesData.map(game => {
        let score = 0;
        const gameGenres = typeof game.genre === 'string' ? game.genre.toLowerCase().split(',').map(g => g.trim()) : [];
        const gamePlayStyles = typeof game.playStyle === 'string' ? game.playStyle.toLowerCase().split(',').map(s => s.trim()) : [];
        const gameThemes = typeof game.theme === 'string' ? game.theme.toLowerCase().split(',').map(t => t.trim()) : []; // NEW: For themes

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

        // NEW: Score based on theme matches (higher weight as it's a single selection)
        selectedTheme.forEach(selectedThemeItem => {
          const lowerSelectedTheme = selectedThemeItem.toLowerCase();
          if (gameThemes.some(t => t.includes(lowerSelectedTheme))) {
            score += 12; // Higher score for theme match
          }
        });

        if (score > 0) {
          score += 1;
        }

        return { ...game, score };
      });

      const sortedGames = scoredGames.sort((a, b) => b.score - a.score);
      const topRecommendations = sortedGames.filter(game => game.score > 0).slice(0, 5);

      if (topRecommendations.length === 0) {
        setErrorMessage("No games found matching your preferences. Try different selections!");
      } else {
        setRecommendations(topRecommendations);
      }
    } catch (error) {
      console.error('Error generating recommendations:', error);
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // NEW: Function to get a random game recommendation
  const generateRandomRecommendation = async () => {
    setIsLoading(true);
    setErrorMessage('');
    setRecommendations([]); // Clear specific recommendations
    setRandomGameRecommendation(null); // Clear previous random game

    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay

    try {
      if (gamesData.length === 0) {
        setErrorMessage("No game data available to pick a random game.");
        setIsLoading(false);
        return;
      }
      const randomIndex = Math.floor(Math.random() * gamesData.length);
      setRandomGameRecommendation(gamesData[randomIndex]);
    } catch (error) {
      console.error('Error generating random recommendation:', error);
      setErrorMessage('An unexpected error occurred while picking a random game.');
    } finally {
      setIsLoading(false);
    }
  };


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

  // Render the main UI
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-indigo-800 flex items-center justify-center p-4 font-sans antialiased">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-2xl transform transition-all duration-300 hover:scale-[1.01]">
        <h1 className="text-4xl font-extrabold text-center text-gray-900 mb-6 tracking-tight">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-red-500">
            Roblox Game Recommender
          </span> 🎮
        </h1>

        <p className="text-center text-gray-600 mb-8 text-lg">
          Discover your next favorite Roblox game! Select your preferences below.
          <br className="hidden sm:inline" /> {/* Line break for smaller screens */}
          <span className="text-sm text-gray-500">Database updated weekly, last updated July 6th.</span>
        </p>

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

        {/* NEW: Theme Filter */}
        <div className="mb-8">
          <MultiSelectDropdown
            label="Preferred Theme"
            options={allAvailableThemes}
            selectedOptions={selectedTheme}
            onSelect={setSelectedTheme}
            limit={1} // Limit to 1 selection for theme
          />
        </div>


        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <button
            onClick={generateRecommendations}
            disabled={isLoading || (selectedGenres.length === 0 && selectedPlayStyles.length === 0 && selectedTheme.length === 0)}
            className={`flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition duration-300 ease-in-out text-xl transform hover:scale-105 ${isLoading || (selectedGenres.length === 0 && selectedPlayStyles.length === 0 && selectedTheme.length === 0) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
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

          {/* NEW: Get a Random Game Button */}
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
              <a
                key={randomGameRecommendation.id}
                href={randomGameRecommendation.link || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-gray-50 p-5 rounded-lg shadow-md border border-gray-200 hover:border-purple-400 transition duration-200 ease-in-out transform hover:-translate-y-1 cursor-pointer"
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
              </a>
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
                <a
                  key={game.id}
                  href={game.link || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-gray-50 p-5 rounded-lg shadow-md border border-gray-200 hover:border-purple-400 transition duration-200 ease-in-out transform hover:-translate-y-1 cursor-pointer"
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
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
