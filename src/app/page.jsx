'use client'
import React, { useState, useCallback, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Sparkles, Loader2, Rocket, ThumbsUp, ThumbsDown, Lightbulb, TrendingUp, Handshake, Code, Gauge, Type, Bot, FileText, ChevronDown } from 'lucide-react';
import Header from './header/page.jsx';
import LoginPage from './login/page.jsx';
import SignupPage from './sign-up/page.jsx';
import Dashboard from './dashboard/page.jsx';
import AnalyzerTool from './analyzer-tool/page.jsx';
import SettingsPage from './settings/page.jsx';
import { auth, initializeAuth, onAuthStateChanged, db } from '../../firebase.js';


// A simple component for the new landing page
const LandingPage = ({ onStartAnalysis }) => (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-gray-200 text-center bg-gray-900 animate-fadeIn">
      <div className="w-full max-w-4xl p-8 bg-gray-800 rounded-3xl shadow-2xl border border-gray-700 space-y-12">
        {/* Hero Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-center space-x-4">
            <Sparkles className="h-12 w-12 text-yellow-400 animate-pulse" />
            <h1 className="text-5xl font-extrabold text-white tracking-tight leading-tight">
              Roblox Game Idea Analyzer
            </h1>
          </div>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Turn your brilliant Roblox concepts into successful games. Our AI-powered tool
            provides a comprehensive, constructive analysis to help you build your next hit.
          </p>
  
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-gray-700 rounded-2xl border border-gray-600 transition-all duration-300 hover:scale-105 hover:shadow-lg">
              <Handshake className="h-10 w-10 text-purple-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Detailed Feedback</h3>
              <p className="text-gray-300">
                Receive in-depth analysis on your game idea's strengths, weaknesses, and potential.
              </p>
            </div>
            <div className="p-6 bg-gray-700 rounded-2xl border border-gray-600 transition-all duration-300 hover:scale-105 hover:shadow-lg">
              <Code className="h-10 w-10 text-purple-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Actionable Improvements</h3>
              <p className="text-gray-300">
                Get creative and practical suggestions to make your game more engaging and fun.
              </p>
            </div>
            <div className="p-6 bg-gray-700 rounded-2xl border border-gray-600 transition-all duration-300 hover:scale-105 hover:shadow-lg">
              <Gauge className="h-10 w-10 text-purple-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Monetization Strategies</h3>
              <p className="text-gray-300">
                Learn how to effectively monetize your game and earn Robux with smart ideas.
              </p>
            </div>
          </div>
  
          <button
            onClick={onStartAnalysis}
            className="px-8 py-4 bg-purple-600 text-white font-bold text-lg rounded-full shadow-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-300 flex items-center space-x-2 mx-auto"
          >
            <Rocket className="h-6 w-6" />
            <span>Analyze Your Idea Now</span>
          </button>
        </div>
  
        {/* How It Works Section */}
        <div className="text-center space-y-6">
          <h2 className="text-4xl font-extrabold text-white tracking-tight">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-gray-700 rounded-2xl border border-gray-600">
              <Type className="h-10 w-10 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">1. Input Your Idea</h3>
              <p className="text-gray-300">
                Describe your Roblox game concept in detail in the text box provided.
              </p>
            </div>
            <div className="p-6 bg-gray-700 rounded-2xl border border-gray-600">
              <Bot className="h-10 w-10 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">2. AI Analysis</h3>
              <p className="text-gray-300">
                Our AI evaluates your idea for originality, potential, and market viability.
              </p>
            </div>
            <div className="p-6 bg-gray-700 rounded-2xl border border-gray-600">
              <FileText className="h-10 w-10 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">3. Get Your Report</h3>
              <p className="text-gray-300">
                Receive an instant, detailed report with ratings, pros, cons, and improvements.
              </p>
            </div>
          </div>
        </div>
  
        {/* FAQ Section */}
        <div className="text-center space-y-6">
          <h2 className="text-4xl font-extrabold text-white tracking-tight">FAQ</h2>
          <div className="text-left w-full max-w-2xl mx-auto space-y-4">
            <details className="bg-gray-700 rounded-2xl p-4 cursor-pointer group transition-all duration-300 open:bg-purple-800 open:text-white">
              <summary className="flex items-center justify-between font-semibold text-lg text-white group-open:text-yellow-400 transition-colors duration-300">
                How does the AI generate an analysis?
                <ChevronDown className="h-6 w-6 transform group-open:rotate-180 transition-transform duration-300" />
              </summary>
              <p className="mt-4 text-gray-300 group-open:text-purple-100">
                Our AI is trained on a vast amount of data related to game design, user engagement, and current trends within the Roblox platform. It uses this knowledge to provide a constructive and detailed evaluation of your idea.
              </p>
            </details>
  
            <details className="bg-gray-700 rounded-2xl p-4 cursor-pointer group transition-all duration-300 open:bg-purple-800 open:text-white">
              <summary className="flex items-center justify-between font-semibold text-lg text-white group-open:text-yellow-400 transition-colors duration-300">
                Is my game idea safe and private?
                <ChevronDown className="h-6 w-6 transform group-open:rotate-180 transition-transform duration-300" />
              </summary>
              <p className="mt-4 text-gray-300 group-open:text-purple-100">
                Yes, your ideas are completely private. We do not store or share the game ideas you submit. The AI processes the information to generate a response, but your data is not saved.
              </p>
            </details>
  
            <details className="bg-gray-700 rounded-2xl p-4 cursor-pointer group transition-all duration-300 open:bg-purple-800 open:text-white">
              <summary className="flex items-center justify-between font-semibold text-lg text-white group-open:text-yellow-400 transition-colors duration-300">
                Can the AI help with multiple ideas at once?
                <ChevronDown className="h-6 w-6 transform group-open:rotate-180 transition-transform duration-300" />
              </summary>
              <p className="mt-4 text-gray-300 group-open:text-purple-100">
                Our tool is designed to analyze one idea at a time to ensure the most detailed and focused feedback. Please submit each idea individually to get the best results.
              </p>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
  
  // The main App component handles routing and renders the correct page
  function App() {
    const [idea, setIdea] = useState('');
    const [analysis, setAnalysis] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState('landing');
    const [user, setUser] = useState(null);
    const [dbInstance, setDbInstance] = useState(null);
    const [authInstance, setAuthInstance] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
  
    useEffect(() => {
      // Initialize Firebase and set up auth listener
      // No need to call initializeAuth here anymore, it's handled in firebase.js
      setDbInstance(db);
      setAuthInstance(auth);
  
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        setIsAuthReady(true);
        if (currentUser) {
          setCurrentPage('dashboard');
        }
      });
  
      // Cleanup the subscription on unmount
      return () => unsubscribe();
    }, []);
  
    const handleLogout = async () => {
      if (authInstance) {
        await authInstance.signOut();
        setCurrentPage('landing');
        setIdea('');
        setAnalysis(null);
      }
    };
  
    const handleLoginSuccess = () => {
      // onAuthStateChanged listener will handle state update and navigation
    };
  
    // New handler function to check auth state before navigating
    const handleStartAnalysis = () => {
      if (user) {
        setCurrentPage('analyzer'); // Changed to go directly to analyzer
      } else {
        setCurrentPage('login');
      }
    };
  
    // Main UI rendering based on currentPage state
    let content;
    if (!isAuthReady) {
      content = <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    } else {
      switch (currentPage) {
        case 'landing':
          content = <LandingPage onStartAnalysis={handleStartAnalysis} />;
          break;
        case 'analyzer':
          content = (
            <AnalyzerTool
              idea={idea}
              setIdea={setIdea}
              analysis={analysis}
              setAnalysis={setAnalysis}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
              error={error}
              setError={setError}
              db={dbInstance}
              user={user}
            />
          );
          break;
        case 'dashboard':
          content = <Dashboard setCurrentPage={setCurrentPage} db={dbInstance} user={user} />;
          break;
        case 'login':
          content = <LoginPage setCurrentPage={setCurrentPage} onLoginSuccess={handleLoginSuccess} />;
          break;
        case 'signup':
          content = <SignupPage setCurrentPage={setCurrentPage} />;
          break;
        case 'settings':
          content = <SettingsPage setCurrentPage={setCurrentPage} user={user} />;
          break;
        default:
          content = <LandingPage onStartAnalysis={handleStartAnalysis} />;
      }
    }
  
    return (
      <div className="min-h-screen bg-gray-900 text-gray-200 font-inter">
        <Header
          setCurrentPage={setCurrentPage}
          userIsAuthenticated={!!user}
          onLogout={handleLogout}
        />
        {content}
      </div>
    );
  }
  
  export default App;

  