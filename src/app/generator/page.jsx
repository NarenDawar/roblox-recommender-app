"use client";

import React, { useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { Lightbulb, Loader2, Wand2, ArrowLeft, Rocket } from 'lucide-react';
import { getAuth } from 'firebase/auth'; // Import getAuth

const GeneratorPage = ({ setCurrentPage, onIdeaGenerated }) => {
  const [userInput, setUserInput] = useState('');
  const [generatedIdea, setGeneratedIdea] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerate = useCallback(async () => {
    setIsLoading(true);
    setGeneratedIdea('');
    setError(null);

    // --- SECURITY CHANGE: GET THE USER'S ID TOKEN ---
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      setError("You must be logged in to generate an idea.");
      setIsLoading(false);
      return;
    }

    try {
      const token = await user.getIdToken(); // Get the Firebase Auth token

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Send the token in the header
        },
        body: JSON.stringify({ keywords: userInput }),
      });

      if (response.status === 403) {
        setError("Permission denied. Please upgrade to Pro to use this feature.");
        setIsLoading(false);
        return;
      }

      const result = await response.json();

      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.choices && result.choices.length > 0) {
        setGeneratedIdea(result.choices[0].message.content);
      } else {
        setError('Could not generate an idea. Please try again.');
      }
    } catch (err) {
      console.error('Request failed:', err);
      setError('Failed to connect to the generation service. Please check your network and try again.');
    } finally {
      setIsLoading(false);
    }
  }, [userInput]);

  const handleAnalyze = () => {
    if (generatedIdea) {
      onIdeaGenerated(generatedIdea);
    }
  };

  const markdownComponents = {
    div: ({ children }) => <div className="prose prose-invert max-w-none">{children}</div>,
    ul: ({node, ...props}) => <ul {...props} className="list-disc pl-5" />,
    li: ({node, ...props}) => <li {...props} className="mb-1" />,
  };

  return (
    <div className="w-full max-w-3xl my-8 mx-auto p-6 bg-gray-800 rounded-3xl shadow-xl border border-gray-700 animate-fadeIn">
      {/* ... rest of the JSX remains the same ... */}
       <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => setCurrentPage('dashboard')}
          className="p-2 text-white rounded-full hover:bg-gray-700 transition-colors duration-300"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
        <div className="flex items-center space-x-2 flex-grow justify-center">
          <Lightbulb className="h-8 w-8 text-yellow-400" />
          <h1 className="text-4xl font-extrabold text-white tracking-tight">Idea Generator</h1>
        </div>
        <div className="w-10"></div>
      </div>
      <p className="text-center text-gray-400 mb-6 max-w-prose mx-auto">
        Stuck in a creative rut? Add some keywords below (like "space", "magic", "cooking") or leave it blank for a completely random idea!
      </p>

      <div className="mb-6">
        <textarea
          className="w-full h-24 p-4 text-gray-200 bg-gray-700 border border-gray-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none transition-all duration-300 placeholder-gray-400"
          placeholder="Optional: type any keywords, themes, or genres..."
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          disabled={isLoading}
        />
      </div>

      <div className="flex justify-center mb-8">
        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className="px-8 py-4 bg-purple-600 text-white font-bold text-lg rounded-full shadow-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-300 flex items-center space-x-2 disabled:bg-gray-600"
        >
          <Wand2 className="h-6 w-6" />
          <span>{isLoading ? 'Generating...' : 'Generate a New Idea'}</span>
        </button>
      </div>

      {isLoading && (
        <div className="flex flex-col items-center justify-center h-48">
          <Loader2 className="h-12 w-12 text-purple-500 animate-spin" />
        </div>
      )}

      {error && (
        <div className="mt-8 p-4 bg-red-800 text-white rounded-2xl border border-red-700">
          <p className="font-semibold">Error:</p>
          <p>{error}</p>
        </div>
      )}

      {generatedIdea && (
        <div className="bg-gray-700 p-6 rounded-2xl border border-gray-600 animate-fadeIn space-y-4">
          <ReactMarkdown components={markdownComponents}>
            {generatedIdea}
          </ReactMarkdown>
          <div className="flex justify-center pt-4">
            <button
              onClick={handleAnalyze}
              className="px-6 py-3 bg-green-600 text-white font-bold rounded-full shadow-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-all duration-300 flex items-center space-x-2"
            >
              <Rocket className="h-5 w-5" />
              <span>Analyze This Idea</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GeneratorPage;
