// app/RecommenderClient.jsx
'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react';
import debounce from 'lodash/debounce';

// Firebase client imports for user state management and sign out
import { auth, db } from '../lib/firebaseClient'; // Adjust path as needed
import { onAuthStateChanged, signOut } from 'firebase/auth';

// Firestore imports for user data
import { doc, getDoc, collection, addDoc, deleteDoc, getDocs, query, where } from 'firebase/firestore';

// Import the new AuthModal component
import AuthModal from '../components/AuthModal';
// Import the new FavoritesPage component
import FavoritesPage from '../components/FavoritesPage';
// NEW: Import the new CuratedListsPage component
import CuratedListsPage from '../components/CuratedListsPage';
// NEW: Import the new AIChatPage component - REMOVED FOR NOW

// Fisher-Yates (Knuth) shuffle algorithm (Keep this as is - though now primarily used on server)
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

// MultiSelectDropdown Component (Keep this as is)
const MultiSelectDropdown = ({ options, selectedOptions, onSelect, limit, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

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

  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
export default function RecommenderClient({ gamesData, gamesLoadError }) {
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedPlayStyles, setSelectedPlayStyles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [randomGameRecommendation, setRandomGameRecommendation] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchInputRef = useRef(null);

  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showFutureUpdatesModal, setShowFutureUpdatesModal] = useState(false);

  // State for authentication
  const [user, setUser] = useState(null); // Firebase user object
  const [loadingAuth, setLoadingAuth] = useState(true); // To indicate initial auth check is ongoing
  const [showAuthModal, setShowAuthModal] = useState(false); // To control auth modal visibility
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'

  // State for sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // State to manage current view ('home', 'favorites', 'curatedLists', or 'aiChat')
  const [currentPageView, setCurrentPageView] = useState('home');

  // State to store favorited game IDs for the current user
  const [favoritedGameIds, setFavoritedGameIds] = useState([]);

  // Re-adding the 2-request limit for guests
  const GUEST_AI_REQUEST_LIMIT = 2;
  const [aiRequestCount, setAiRequestCount] = useState(() => {
    // Initialize from sessionStorage to persist across refreshes for anonymous users
    if (typeof window !== 'undefined') {
      const savedCount = sessionStorage.getItem('aiRequestCount');
      return savedCount ? parseInt(savedCount, 10) : 0;
    }
    return 0;
  });

  // REMOVED: allSortedRecommendations state is no longer needed on the client
  // const [allSortedRecommendations, setAllSortedRecommendations] = useState([]);

  // NEW: State to store the total count of recommended games from the API
  const [totalRecommendedGamesCount, setTotalRecommendedGamesCount] = useState(0);

  const [currentPage, setCurrentPage] = useState(1);
  const GAMES_PER_PAGE = 5; // Number of games to display per page

  // NEW: State for welcome screen
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  // NEW: State for the second welcome message's fade in/out
  const [showSecondaryWelcomeMessage, setShowSecondaryWelcomeMessage] = useState(false);


  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
      // Fetch favorites when user auth state changes
      if (currentUser) {
        fetchFavoritedGameIds(currentUser.uid);
        // Reset AI request count for logged-in users, or allow unlimited
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('aiRequestCount');
        }
        setAiRequestCount(0); // Logged-in users have unlimited access
      } else {
        setFavoritedGameIds([]); // Clear favorites if logged out
        // For anonymous users, ensure count is loaded from session storage
        if (typeof window !== 'undefined') {
          const savedCount = sessionStorage.getItem('aiRequestCount');
          setAiRequestCount(savedCount ? parseInt(savedCount, 10) : 0);
        }
      }
    });
    return () => unsubscribe(); // Cleanup subscription
  }, []);

  // Effect for welcome screen - MODIFIED
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasVisited = sessionStorage.getItem('hasVisitedRBXDiscover');
      if (!hasVisited) {
        setShowWelcomeScreen(true);
        sessionStorage.setItem('hasVisitedRBXDiscover', 'true');

        // Fade in main message (already visible from setShowWelcomeScreen(true))
        // Then fade in secondary message
        const secondaryMessageTimer = setTimeout(() => {
          setShowSecondaryWelcomeMessage(true);
        }, 1000); // Secondary message fades in after 1 second

        // Start fade out for both messages after a delay
        const fadeOutTimer = setTimeout(() => {
          setIsFadingOut(true);
          setShowSecondaryWelcomeMessage(false); // Also fade out secondary message
        }, 3000); // Start fade out after 3 seconds (1s for primary, 1s for secondary, 1s visible for both)

        const hideTimer = setTimeout(() => {
          setShowWelcomeScreen(false);
          setIsFadingOut(false);
        }, 4000); // Fully hide after 4 seconds (1s for primary, 1s for secondary, 1s visible for both, 1s fade-out)

        return () => {
          clearTimeout(secondaryMessageTimer);
          clearTimeout(fadeOutTimer);
          clearTimeout(hideTimer);
        };
      }
    }
  }, []); // Only run once on mount

  // Effect to save AI request count to sessionStorage
  useEffect(() => {
    if (!user && typeof window !== 'undefined') { // Only save for anonymous users
      sessionStorage.setItem('aiRequestCount', aiRequestCount.toString());
    }
  }, [aiRequestCount, user]);


  // Effect to close sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is outside the sidebar and the hamburger icon
      const sidebar = document.getElementById('sidebar');
      const hamburgerIcon = document.getElementById('hamburger-icon');
      if (sidebar && !sidebar.contains(event.target) && hamburgerIcon && !hamburgerIcon.contains(event.target)) {
        setIsSidebarOpen(false);
      }
    };

    if (isSidebarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSidebarOpen]);

  // Function to fetch favorited game IDs from Firestore
  const fetchFavoritedGameIds = async (userId) => {
    if (!userId) {
      setFavoritedGameIds([]);
      return;
    }
    try {
      // Ensure __app_id is defined before using it
      const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
      const favoritesCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/favorites`);
      const q = query(favoritesCollectionRef);
      const querySnapshot = await getDocs(q);
      const ids = querySnapshot.docs.map(doc => doc.data().gameId);
      setFavoritedGameIds(ids);
    } catch (error) {
      console.error("Error fetching favorite game IDs:", error);
      setErrorMessage("Failed to load favorites.");
    }
  };

  // Function to toggle a game's favorite status
  const toggleFavorite = async (gameId) => {
    if (!user) {
      setErrorMessage("Please log in to favorite games.");
      setShowAuthModal(true);
      setAuthMode('login'); // Suggest login if not authenticated
      return;
    }

    const userId = user.uid;
    // Ensure __app_id is defined before using it
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    const favoritesCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/favorites`);
    const isCurrentlyFavorited = favoritedGameIds.includes(gameId);

    try {
      if (isCurrentlyFavorited) {
        // Remove from favorites
        const q = query(favoritesCollectionRef, where("gameId", "==", gameId));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach(async (docToDelete) => {
          await deleteDoc(docToDelete.ref);
        });
        setFavoritedGameIds(prevIds => prevIds.filter(id => id !== gameId));
      } else {
        // Add to favorites
        await addDoc(favoritesCollectionRef, {
          gameId: gameId,
          favoritedAt: new Date(), // Store timestamp
        });
        setFavoritedGameIds(prevIds => [...prevIds, gameId]);
      }
      setErrorMessage(''); // Clear any previous errors

      // --- NEW LOGIC TO UPDATE DISPLAYED RECOMMENDATIONS ---
      // Update the isFavorite status for the game in the current recommendations list
      setRecommendations(prevRecs =>
        prevRecs.map(rec =>
          rec.id === gameId ? { ...rec, isFavorite: !isCurrentlyFavorited } : rec
        )
      );

      // Update the isFavorite status for the random game recommendation if it's the one being toggled
      if (randomGameRecommendation && randomGameRecommendation.id === gameId) {
        setRandomGameRecommendation(prevRandom => ({
          ...prevRandom,
          isFavorite: !isCurrentlyFavorited
        }));
      }
      // --- END NEW LOGIC ---

    } catch (error) {
      console.error("Error toggling favorite status:", error);
      setErrorMessage("Failed to update favorite status.");
    }
  };


  // Function to extract unique tags (genres or play styles) from the game data (Keep this as is)
  const extractUniqueTags = (games, type) => {
    const tags = new Set();
    games.forEach(game => {
      if (typeof game[type] === 'string') {
        const gameTags = game[type].split(',').map(tag => tag.trim());
        gameTags.forEach(tag => tags.add(tag));
      }
    });
    return Array.from(tags).sort();
  };

  const allAvailableGenres = extractUniqueTags(gamesData, 'genre');
  const allAvailablePlayStyles = extractUniqueTags(gamesData, 'playStyle');

  const getSuggestions = useCallback(
    debounce((value) => {
      if (!value.trim()) {
        setSuggestions([]);
        return;
      }
      const lowerValue = value.toLowerCase().trim();
      const filtered = gamesData.filter(game =>
        game.name.toLowerCase().includes(lowerValue) ||
        (game.genre && game.genre.toLowerCase().includes(lowerValue)) ||
        (game.playStyle && game.playStyle.toLowerCase().includes(lowerValue)) ||
        (game.theme && game.theme.toLowerCase().includes(lowerValue))
      );

      const uniqueNames = Array.from(new Set(filtered.map(game => game.name))).slice(0, 15);
      setSuggestions(uniqueNames);
      setShowSuggestions(uniqueNames.length > 0);
    }, 300),
    [gamesData]
  );

  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    getSuggestions(value);
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchTerm(suggestion);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchInputRef.current && !searchInputRef.current.contains(event.target)) {
        setShowSuggestions(false);
        setSuggestions([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickCriticside);
    };
  }, []);


  // Function to generate recommendations by calling the API route
  const generateRecommendations = async (pageToFetch = 1) => {
    setIsLoading(true);
    setErrorMessage('');
    setRandomGameRecommendation(null); // Clear random game when fetching smart recs
    setShowSuggestions(false);

    // Simulate network delay for better UX
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      if (selectedGenres.length === 0 && selectedPlayStyles.length === 0 && !searchTerm.trim()) {
        setErrorMessage("Please select at least one preferred genre or play style, or enter a search term to get recommendations.");
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selectedGenres,
          selectedPlayStyles,
          searchTerm,
          isRandom: false, // Not a random request
          page: pageToFetch,
          limit: GAMES_PER_PAGE,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.errorMessage || 'Failed to fetch recommendations.');
      }

      if (result.errorMessage) {
        setErrorMessage(result.errorMessage);
        setRecommendations([]);
        setTotalRecommendedGamesCount(0); // Reset total count on error
        setCurrentPage(1); // Reset page on error
      } else {
        // Map the recommendations from the API to include isFavorite status
        const recommendationsWithFavorites = result.recommendations.map(game => ({
          ...game,
          isFavorite: favoritedGameIds.includes(game.id)
        }));
        setRecommendations(recommendationsWithFavorites);
        setTotalRecommendedGamesCount(result.totalCount); // Set total count from API response
        setCurrentPage(pageToFetch);
      }
    } catch (error) {
      console.error('Error generating recommendations:', error);
      setErrorMessage(error.message || 'An unexpected error occurred. Please try again.');
      setRecommendations([]);
      setTotalRecommendedGamesCount(0); // Reset total count on error
      setCurrentPage(1); // Reset page on error
    } finally {
      setIsLoading(false);
    }
  };

  // Function to get a random game recommendation by calling the API route
  const generateRandomRecommendation = async () => {
    setIsLoading(true);
    setErrorMessage('');
    setRecommendations([]); // Clear smart recommendations when fetching random
    // REMOVED: setAllSortedRecommendations([]); // No longer needed
    setTotalRecommendedGamesCount(0); // Clear total count for random pick
    setCurrentPage(1); // Reset page
    setShowSuggestions(false);

    // Simulate network delay for better UX
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          searchTerm,
          isRandom: true, // This is a random request
          selectedGenres: [], // Not relevant for random, but API expects it
          selectedPlayStyles: [], // Not relevant for random, but API expects it
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.errorMessage || 'Failed to fetch random recommendation.');
      }

      if (result.errorMessage) {
        setErrorMessage(result.errorMessage);
        setRandomGameRecommendation(null);
      } else {
        // Map the random recommendation to include isFavorite status
        const randomGameWithFavorite = result.recommendations[0] ? {
          ...result.recommendations[0],
          isFavorite: favoritedGameIds.includes(result.recommendations[0].id)
        } : null;
        setRandomGameRecommendation(randomGameWithFavorite);
      }
    } catch (error) {
      console.error('Error generating random recommendation:', error);
      setErrorMessage(error.message || 'An unexpected error occurred while picking a random game.');
      setRandomGameRecommendation(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Pagination functions (now call generateRecommendations with new page)
  const goToNextPage = () => {
    generateRecommendations(currentPage + 1);
  };

  const goToPreviousPage = () => {
    generateRecommendations(currentPage - 1);
  };

  // Function to clear all selected filters and search term (Keep as is)
  const clearAllFilters = () => {
    setSelectedGenres([]);
    setSelectedPlayStyles([]);
    setSearchTerm('');
    setErrorMessage('');
    setRecommendations([]);
    setRandomGameRecommendation(null);
    // REMOVED: setAllSortedRecommendations([]); // No longer needed
    setTotalRecommendedGamesCount(0); // Clear total count
    setCurrentPage(1);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  // Functions to open and close the help modal
  const openHelpModal = () => setShowHelpModal(true);
  const closeHelpModal = () => setShowHelpModal(false);

  // Functions to open and close the Future Updates modal
  const openFutureUpdatesModal = () => setShowFutureUpdatesModal(true);
  const closeFutureUpdatesModal = () => setShowFutureUpdatesModal(false);

  // Handle user logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setErrorMessage(''); // Clear any previous errors
      setIsSidebarOpen(false); // Close sidebar on logout
      setCurrentPageView('home'); // Go back to home page on logout
      setAiRequestCount(0); // Reset AI count for new anonymous session
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('aiRequestCount');
      }
    } catch (error) {
      setErrorMessage('Failed to log out: ' + error.message);
      console.error('Logout error:', error);
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

  // totalPages is now calculated based on totalRecommendedGamesCount (which comes from API)
  const totalPages = Math.ceil(totalRecommendedGamesCount / GAMES_PER_PAGE);

  // Determine the color of the hamburger icon based on the current page view
  // On 'home' page, it's purple by default and white on md screens up (for dark background)
  // On other pages (favorites, aiChat), it's always white (as it's on a dark background)
  const hamburgerColorClass = currentPageView === 'home'
    ? 'text-purple-600 md:text-white' // Home page behavior: purple on small, white on md+
    : 'text-white'; // Other pages: always white

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-indigo-800 flex items-center justify-center p-4 font-sans antialiased relative">
      {/* Welcome Screen Overlay - MODIFIED */}
      {showWelcomeScreen && (
        <div className={`fixed inset-0 bg-gradient-to-br from-purple-800 to-indigo-900 flex flex-col items-center justify-center z-50 transition-opacity duration-1000 ${isFadingOut ? 'opacity-0' : 'opacity-100'}`}>
          <h1 className={`text-5xl font-extrabold text-white text-center transition-opacity duration-1000 ${isFadingOut ? 'opacity-0' : 'opacity-100'}`}>
            Welcome to RBXDiscover!
          </h1>
          <p className={`text-3xl font-bold text-white text-center mt-4 transition-opacity duration-1000 ${showSecondaryWelcomeMessage ? 'opacity-100' : 'opacity-0'}`}>
            We hope you enjoy!
          </p>
        </div>
      )}

      {/* Hamburger Icon for Sidebar */}
      <button
        id="hamburger-icon"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className={`absolute top-4 left-4 z-40 ${hamburgerColorClass} focus:outline-none p-2 rounded-lg hover:bg-gray-200 cursor-pointer transition duration-200`}
        aria-label="Open sidebar menu"
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path>
        </svg>
      </button>

      {/* Sidebar Overlay (dims background when sidebar is open) */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)} // Close sidebar when clicking overlay
        ></div>
      )}

      {/* Sidebar Content */}
      <div
        id="sidebar"
        className={`fixed top-0 left-0 h-full bg-gradient-to-br from-purple-900 to-indigo-900 text-white w-64 p-6 shadow-lg z-40 flex flex-col justify-between transform transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div> {/* Wrapper for top content */}
          <button
            onClick={() => setIsSidebarOpen(false)}
            // Removed hover effect, added cursor-pointer
            className="absolute top-4 right-4 text-white text-3xl focus:outline-none p-2 rounded-lg cursor-pointer transition duration-200"
            aria-label="Close sidebar menu"
          >
            &times;
          </button>
          <div className="mt-12 flex flex-col space-y-4">
            {/* Conditional rendering for user state */}
            {loadingAuth ? (
              <span className="text-white text-sm">Loading user...</span>
            ) : user ? (
              <>
                {/* Email text with word wrapping - now first */}
                <span className="text-white text-lg font-medium break-words">
                  Welcome, {user.displayName || user.email}!
                </span>
                {/* Home Button - now second */}
                <button
                  onClick={() => {
                    setCurrentPageView('home');
                    setIsSidebarOpen(false); // Close sidebar
                  }}
                  className="bg-white text-purple-800 font-bold py-2 px-4 rounded-lg shadow-md hover:bg-gray-100 transition duration-200 ease-in-out text-base transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-purple-800 cursor-pointer"
                >
                  Home
                </button>
                {/* Favorites Button */}
                <button
                  onClick={() => {
                    setCurrentPageView('favorites');
                    setIsSidebarOpen(false); // Close sidebar
                  }}
                  className="bg-white text-purple-800 font-bold py-2 px-4 rounded-lg shadow-md hover:bg-gray-100 transition duration-200 ease-in-out text-base transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-purple-800 cursor-pointer"
                >
                  Favorites
                </button>
                {/* NEW: Curated Lists Button */}
                <button
                  onClick={() => {
                    setCurrentPageView('curatedLists'); // Set new page view
                    setIsSidebarOpen(false); // Close sidebar
                  }}
                  className="bg-white text-purple-800 font-bold py-2 px-4 rounded-lg shadow-md hover:bg-gray-100 transition duration-200 ease-in-out text-base transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-purple-800 cursor-pointer"
                >
                  Curated Lists
                </button>
                {/* NEW: AI Chat Button for logged-in users - REMOVED FOR NOW */}
                {/*
                <button
                  onClick={() => {
                    setCurrentPageView('aiChat');
                    setIsSidebarOpen(false); // Close sidebar
                  }}
                  className="bg-white text-purple-800 font-bold py-2 px-4 rounded-lg shadow-md hover:bg-gray-100 transition duration-200 ease-in-out text-base transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-purple-800 cursor-pointer"
                >
                  AI Chat
                </button>
                */}
              </>
            ) : (
              <>
                {/* Home Button (remains here for guests) */}
                <button
                  onClick={() => {
                    setCurrentPageView('home');
                    setIsSidebarOpen(false); // Close sidebar
                  }}
                  className="bg-white text-purple-800 font-bold py-2 px-4 rounded-lg shadow-md hover:bg-gray-100 transition duration-200 ease-in-out text-base transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-purple-800 cursor-pointer"
                >
                  Home
                </button>
                <button
                  onClick={() => {
                    setAuthMode('signup');
                    setShowAuthModal(true);
                    setIsSidebarOpen(false); // Close sidebar when opening auth modal
                  }}
                  className="bg-white text-purple-800 font-bold py-2 px-4 rounded-lg shadow-md hover:bg-gray-100 transition duration-200 ease-in-out text-base transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-purple-800 cursor-pointer"
                >
                  Sign Up
                </button>
                {/* NEW: AI Chat Button for guest users - REMOVED FOR NOW */}
                {/*
                <button
                  onClick={() => {
                    setCurrentPageView('aiChat');
                    setIsSidebarOpen(false); // Close sidebar
                  }}
                  className="bg-white text-purple-800 font-bold py-2 px-4 rounded-lg shadow-md hover:bg-gray-100 transition duration-200 ease-in-out text-base transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-purple-800 cursor-pointer"
                >
                  AI Chat
                  {aiRequestCount < GUEST_AI_REQUEST_LIMIT && (
                    <span className="ml-2 px-2 py-1 text-xs font-semibold text-white bg-blue-500 rounded-full">
                      {GUEST_AI_REQUEST_LIMIT - aiRequestCount} left
                    </span>
                  )}
                </button>
                */}
              </>
            )}
          </div>
        </div> {/* End Wrapper for top content */}

        {/* Logout Button at the bottom of the sidebar */}
        {!loadingAuth && user && (
          <div className="pb-4 px-2"> {/* Added padding for spacing from bottom */}
            <button
              onClick={handleLogout}
              // Styled like the Favorites/Sign Up button
              className="w-full bg-white text-purple-800 font-bold py-2 px-4 rounded-lg shadow-md hover:bg-gray-100 transition duration-200 ease-in-out text-base transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-purple-800 cursor-pointer"
            >
              Logout
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area - this single div will contain either the home or favorites view */}
      {/* The main content div is now conditionally rendered inside RecommenderClient */}
      {/* Its background will change depending on the currentPageView */}
      <div className={`
        ${currentPageView === 'home' ? 'bg-white p-8 rounded-xl shadow-2xl w-full max-w-2xl transform transition-all duration-300 hover:scale-[1.01]' : ''}
        ${currentPageView === 'favorites' ? 'w-full h-full max-w-2xl transform transition-all duration-300' : ''}
        ${currentPageView === 'curatedLists' ? 'w-full h-full max-w-2xl transform transition-all duration-300' : ''}
        ${currentPageView === 'aiChat' ? 'w-full h-full transform transition-all duration-300' : ''}
      `}>
        {currentPageView === 'home' && (
          <> {/* Use a fragment here if the home content has multiple top-level elements */}
            <h1 className="text-4xl font-extrabold text-center text-gray-900 mb-6 tracking-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-red-500">
                RBXDiscover: A Roblox Game Recommender
              </span> 🎮
            </h1>

            <p className="text-center text-gray-600 mb-4 text-lg">
              Discover your next favorite Roblox game! Select your preferences below or search directly. Sign in to access favoriting and curated lists.
              <br className="hidden sm:inline" />
              <span className="text-sm text-gray-500">Database updated weekly.</span>
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


            {/* Search Bar with Autocomplete */}
            <div className="mb-6 relative" ref={searchInputRef}>
              <label htmlFor="gameSearch" className="block text-gray-700 text-lg font-semibold mb-2">
                Search for a game by name, genre, or style:
              </label>
              <input
                type="text"
                id="gameSearch"
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800 text-base transition duration-200 ease-in-out"
                placeholder="e.g., Adopt Me, horror, PvP"
                value={searchTerm}
                onChange={handleSearchInputChange}
                onFocus={() => {
                    if (searchTerm.trim() && suggestions.length > 0) {
                        setShowSuggestions(true);
                    } else if (searchTerm.trim() && !suggestions.length) {
                        getSuggestions(searchTerm);
                    }
                }}
                aria-label="Search for games"
                autoComplete="off"
              />

              {/* Autocomplete Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && searchTerm.trim() && (
                <ul className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {suggestions.map((suggestion) => (
                    <li
                      key={suggestion}
                      className="px-4 py-2 cursor-pointer hover:bg-gray-100 text-gray-900"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      {suggestion}
                    </li>
                  ))}
                </ul>
              )}
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
                onClick={() => generateRecommendations(1)} // Start from page 1
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

          {/* Render individual game cards for recommendations or random pick */}
          {randomGameRecommendation && (
            <div className="mt-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-5 text-center">
                Your Random Pick:
              </h2>
              <div className="space-y-4">
                <GameCard
                  game={randomGameRecommendation}
                  toggleFavorite={toggleFavorite}
                  isFavorite={randomGameRecommendation.isFavorite}
                />
              </div>
            </div>
          )}

          {recommendations.length > 0 && (
            <div className="mt-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-5 text-center">
                Your Top Smart Recommendations:
              </h2>
              <div className="space-y-4">
                {recommendations.map((game) => (
                  <GameCard
                    key={game.id}
                    game={game}
                    toggleFavorite={toggleFavorite}
                    isFavorite={game.isFavorite}
                  />
                ))}
              </div>
              {/* Pagination controls */}
              {totalPages > 1 && ( // Only show pagination if there's more than 1 page
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
          </>
        )}

        {/* Conditional Rendering of Favorites Page */}
        {currentPageView === 'favorites' && (
          <FavoritesPage
            user={user}
            gamesData={gamesData}
            favoritedGameIds={favoritedGameIds}
            toggleFavorite={toggleFavorite}
            onBackToHome={() => setCurrentPageView('home')}
          />
        )}

        {/* NEW: Conditional Rendering of Curated Lists Page */}
        {currentPageView === 'curatedLists' && (
          <CuratedListsPage
            user={user}
            gamesData={gamesData}
            onBackToHome={() => setCurrentPageView('home')}
          />
        )}

        {/* NEW: Conditional Rendering of AI Chat Page - REMOVED FOR NOW */}
        {/*
        {currentPageView === 'aiChat' && (
          <AIChatPage
            user={user}
            aiRequestCount={aiRequestCount}
            setAiRequestCount={setAiRequestCount}
            guestLimit={GUEST_AI_REQUEST_LIMIT}
            setAuthMode={setAuthMode}
            setShowAuthModal={setShowAuthModal}
            onBackToHome={() => setCurrentPageView('home')}
          />
        )}
        */}
      </div> {/* End of Main Content Area */}


      {showHelpModal && <HelpModal onClose={closeHelpModal} />}
      {showFutureUpdatesModal && <FutureUpdatesModal onClose={closeFutureUpdatesModal} />}

      {/* Render AuthModal conditionally */}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onAuthSuccess={() => {
            setShowAuthModal(false);
            // Optionally, show a success message or redirect
          }}
          initialMode={authMode} // Pass the initial mode to the modal
        />
      )}
    </div>
  );
}

// NEW: GameCard Component - extracted for reusability and favorite button
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
          // Always fill with currentColor to make it solid
          fill="currentColor"
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
