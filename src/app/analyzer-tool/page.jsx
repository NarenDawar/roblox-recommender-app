'use client'
import React, { useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { Sparkles, Loader2, Rocket, ThumbsUp, ThumbsDown, Lightbulb, TrendingUp } from 'lucide-react';

// AnalyzerTool component handles the core logic for idea analysis
const AnalyzerTool = ({ idea, setIdea, analysis, setAnalysis, isLoading, setIsLoading, error, setError, db, user }) => {

    // Function to handle the form submission and API call
    const handleSubmit = useCallback(async (e) => {
      e.preventDefault();
      setIsLoading(true);
      setAnalysis(null);
      setError(null);
  
      // The prompt for the generative AI
      const prompt = `Analyze the following Roblox game idea. Provide a detailed, helpful, and constructive analysis in Markdown format. The analysis should include:
  
  1.  A short, catchy **Overall Rating** (e.g., "Highly Promising! 🚀").
  2.  A **Pros** section with bullet points highlighting the strengths.
  3.  A **Cons** section with bullet points detailing potential weaknesses or challenges.
  4.  An **Improvements** section with actionable, creative suggestions.
  5.  A **Monetization Strategy** section with ideas for how the game could make Robux.
  
  Game Idea: "${idea}"`;
  
      const chatHistory = [{ role: 'user', parts: [{ text: prompt }] }];
      const payload = { contents: chatHistory };
      const apiKey = "";
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
      
      // Function to handle exponential backoff for API retries
      const fetchWithRetry = async (url, options, retries = 3) => {
        let delay = 1000; // 1 second
        for (let i = 0; i < retries; i++) {
          try {
            const response = await fetch(url, options);
            if (response.status === 429 && i < retries - 1) {
              console.warn(`API call failed with status 429. Retrying in ${delay}ms...`);
              await new Promise(resolve => setTimeout(resolve, delay));
              delay *= 2; // Exponential backoff
              continue;
            }
            return response;
          } catch (err) {
            if (i < retries - 1) {
              console.error(`API call failed: ${err}. Retrying in ${delay}ms...`);
              await new Promise(resolve => setTimeout(resolve, delay));
              delay *= 2;
            } else {
              throw err;
            }
          }
        }
        throw new Error('API call failed after multiple retries.');
      };
  
      try {
        const response = await fetchWithRetry(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
  
        const result = await response.json();
        if (result.candidates && result.candidates.length > 0 && result.candidates[0].content && result.candidates[0].content.parts && result.candidates[0].content.parts.length > 0) {
          const generatedAnalysis = result.candidates[0].content.parts[0].text;
          setAnalysis(generatedAnalysis);
  
          // Save the project to Firestore
          if (db && user) {
            const projectsRef = collection(db, `artifacts/roblox-recommender/users/${user.uid}/projects`);
            await addDoc(projectsRef, {
              idea: idea,
              analysis: generatedAnalysis,
              createdAt: new Date()
            });
            console.log("Project saved to Firestore.");
          } else {
            console.warn("User not authenticated or db not available. Project not saved.");
          }
        } else {
          setError('No analysis could be generated. Please try again.');
        }
      } catch (err) {
        console.error('Failed to fetch from the API:', err);
        setError('Failed to connect to the analysis service. Please check your network and try again.');
      } finally {
        setIsLoading(false);
      }
    }, [idea, setAnalysis, setIsLoading, setError]);
  
  
    return (
      <div className="w-full max-w-3xl my-8 mx-auto p-6 bg-gray-800 rounded-3xl shadow-xl border border-gray-700 animate-fadeIn">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <Sparkles className="h-8 w-8 text-yellow-400" />
          <h1 className="text-4xl font-extrabold text-white text-center tracking-tight">Roblox Idea Analyzer</h1>
        </div>
        <p className="text-center text-gray-400 mb-6 max-w-prose mx-auto">
          Enter your Roblox game idea below, and our AI will provide a detailed,
          constructive analysis to help you make it a hit!
        </p>
  
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            className="w-full h-48 p-4 text-gray-200 bg-gray-700 border border-gray-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none transition-all duration-300 placeholder-gray-400"
            placeholder="Describe your Roblox game idea here..."
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            required
          />
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={isLoading || !idea.trim()}
              className="px-6 py-3 bg-purple-600 text-white font-bold rounded-full shadow-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Rocket className="h-5 w-5" />
                  <span>Get Analysis</span>
                </>
              )}
            </button>
          </div>
        </form>
  
        {error && (
          <div className="mt-8 p-4 bg-red-800 text-white rounded-2xl border border-red-700">
            <p className="font-semibold">Error:</p>
            <p>{error}</p>
          </div>
        )}
  
        {analysis && (
          <div className="mt-8">
            <div className="flex items-center space-x-2 mb-4">
              <Sparkles className="h-6 w-6 text-yellow-400" />
              <h2 className="text-2xl font-bold text-white">AI Analysis</h2>
            </div>
            <div className="p-6 bg-gray-700 rounded-2xl shadow-inner border border-gray-600 overflow-y-auto max-h-[70vh]">
              <ReactMarkdown
                className="prose prose-invert max-w-none prose-h1:text-yellow-400 prose-h2:text-white prose-h3:text-gray-200 prose-h2:mt-4 prose-h3:mt-3 prose-p:text-gray-300 prose-li:text-gray-300"
                components={{
                  h1: ({node, ...props}) => <h2 {...props} className="text-2xl font-bold text-yellow-400 mt-0" />,
                  h2: ({node, ...props}) => <h3 {...props} className="text-xl font-bold text-white mt-4" />,
                  strong: ({node, ...props}) => <strong {...props} className="text-yellow-400" />,
                  ul: ({node, ...props}) => <ul {...props} className="list-disc list-inside space-y-1 pl-4" />,
                  li: ({node, ...props}) => <li {...props} className="text-gray-300" />,
                }}
              >
                {analysis}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  export default AnalyzerTool;
  
