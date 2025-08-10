"use client";

import React, { useState, useCallback, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Sparkles, Loader2, Rocket, ThumbsUp, ThumbsDown, Lightbulb, TrendingUp, Megaphone, ArrowLeft, ChevronDown, Users, Activity, Scaling } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';


// --- MODIFIED PARSER ---
// Helper function to parse the AI's new markdown structure with three scores.
const parseAnalysis = (markdown) => {
    const sections = {
      viralityPotential: '',
      originality: '',
      monetizability: '',
      pros: '',
      cons: '',
      improvements: '',
      monetization: '',
      promotion: '',
      targetAudience: '',
      trendAlignment: '',
      comparativeAnalysis: '',
    };

    const lines = markdown.split('\n');
    let currentSection = '';

    for (const line of lines) {
      const cleanLine = line.trim().toLowerCase();

      if (cleanLine.match(/virality\s*potential/)) {
        currentSection = 'viralityPotential';
      } else if (cleanLine.match(/^(\*{0,2}|#+)?\s*originality/)) {
        currentSection = 'originality';
      } else if (cleanLine.match(/^(\*{0,2}|#+)?\s*monetizability/)) {
        currentSection = 'monetizability';
      }
      else if (cleanLine.match(/^(\*{0,2}|#+)?\s*pros/)) {
        currentSection = 'pros';
      }
      else if (cleanLine.match(/^(\*{0,2}|#+)?\s*cons/)) {
        currentSection = 'cons';
      }
      else if (cleanLine.match(/^(\*{0,2}|#+)?\s*improvements/)) {
        currentSection = 'improvements';
      }
      else if (cleanLine.match(/^(\*{0,2}|#+)?\s*monetization/)) {
        currentSection = 'monetization';
      }
      else if (cleanLine.match(/^(\*{0,2}|#+)?\s*promotion/)) {
        currentSection = 'promotion';
      }
      else if (cleanLine.match(/^(\*{0,2}|#+)?\s*target/)) {
        currentSection = 'targetAudience';
      }
      else if (cleanLine.match(/^(\*{0,2}|#+)?\s*trend/)) {
        currentSection = 'trendAlignment';
      }
      else if (cleanLine.match(/^(\*{0,2}|#+)?\s*comparative/)) {
        currentSection = 'comparativeAnalysis';
      }
      else if (line.trim() !== '' && currentSection) {
        sections[currentSection] += line + '\n';
      }
    }
    // Add the score to each section for easier access later
    for (const key in sections) {
        if (['viralityPotential', 'originality', 'monetizability'].includes(key)) {
            const scoreMatch = sections[key].match(/Score:\s*(\d+)\/10/);
            if (scoreMatch) {
              sections[key] = {
                text: sections[key].replace(/Score:\s*\d+\/10/, '').trim(),
                score: scoreMatch[1],
                fullScore: scoreMatch[0].replace('Score: ', '')
              };
            } else {
               sections[key] = { text: sections[key], score: null, fullScore: 'N/A' };
            }
        }
    }

    return sections;
};

// Collapsible Section Component
const CollapsibleSection = ({ icon, title, children }) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="bg-gray-700 rounded-2xl border border-gray-600">
      <button
        className="w-full flex items-center justify-between p-6 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="text-xl font-bold text-white flex items-center space-x-2">
          {icon}
          <span>{title}</span>
        </h3>
        <ChevronDown
          className={`h-6 w-6 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen && (
        <div className="px-6 pb-6 prose prose-invert max-w-none">
          {children}
        </div>
      )}
    </div>
  );
};


const AnalyzerTool = ({ idea, setIdea, analysis, setAnalysis, isLoading, setIsLoading, error, setError, db, user, initialIdea, initialAnalysis, setCurrentPage }) => {
  const [appId] = useState('roblox-analyzer'); // Static app ID
  const [parsedAnalysis, setParsedAnalysis] = useState(null);
  const [isContentVisible, setIsContentVisible] = useState(true);

  // --- MODIFIED SCORE COLOR LOGIC ---
  // Adjusted for a 0-10 scale.
  const getScoreColor = (score) => {
    if (score === null || isNaN(score)) return 'text-gray-400';
    if (score >= 8) return 'text-green-400';
    if (score >= 5) return 'text-yellow-400';
    return 'text-red-400';
  };

  useEffect(() => {
    if (initialAnalysis || initialIdea) {
      setAnalysis(initialAnalysis);
      setParsedAnalysis(initialAnalysis ? parseAnalysis(initialAnalysis) : null);
      setIdea(initialIdea || '');
    }
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setIsContentVisible(false);
    setIsLoading(true);
    setAnalysis(null);
    setParsedAnalysis(null); // Clear previous parsed data
    setError(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea }),
      });

      const result = await response.json();

      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.choices && result.choices.length > 0) {
        const generatedAnalysis = result.choices[0].message.content;
        console.log(generatedAnalysis);
        setAnalysis(generatedAnalysis);
        setParsedAnalysis(parseAnalysis(generatedAnalysis)); // Parse the new data

        if (db && user) {
          const projectsRef = collection(db, `artifacts/${appId}/users/${user.uid}/projects`);
          await addDoc(projectsRef, {
            idea,
            analysis: generatedAnalysis,
            createdAt: new Date()
          });
        }
      } else {
        setError('No analysis could be generated. Please try again.');
      }
    } catch (err) {
      console.error('Request failed:', err);
      setError('Failed to connect to the analysis service. Please check your network and try again.');
    } finally {
      setIsLoading(false);
      setIsContentVisible(true);
      setIdea('');
    }
  }, [idea, setAnalysis, setIsLoading, setError, setIdea, db, user, appId]);

  const markdownComponents = {
    ul: ({node, ...props}) => <ul {...props} className="list-none space-y-1" />,
    li: ({node, ...props}) => <li {...props} className="before:content-['-'] before:text-gray-300 before:mr-2 text-gray-300" />,
  };

  // Score Card Component for reusability
  const ScoreCard = ({ title, scoreData }) => (
    <div className="bg-gray-700 p-6 rounded-2xl border border-gray-600 flex flex-col justify-between">
      <div>
        <h3 className="text-xl font-bold text-white">{title}</h3>
        <p className="text-gray-300 mt-2 text-sm">{scoreData?.text}</p>
      </div>
      <span className={`text-4xl font-extrabold text-right mt-4 ${getScoreColor(scoreData?.score)}`}>
        {scoreData?.score}/10
      </span>
    </div>
  );

  return (
    <div className="w-full max-w-3xl my-8 mx-auto p-6 bg-gray-800 rounded-3xl shadow-xl border border-gray-700 animate-fadeIn">
       {/* Header */}
       <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => setCurrentPage('dashboard')}
          className="p-2 text-white rounded-full hover:bg-gray-700 transition-colors duration-300 cursor-pointer"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
        <div className="flex items-center space-x-2 flex-grow justify-center">
          <Sparkles className="h-8 w-8 text-yellow-400" />
          <h1 className="text-4xl font-extrabold text-white tracking-tight">Roblox Idea Analyzer</h1>
        </div>
        <div className="w-10"></div>
      </div>
      <p className="text-center text-gray-400 mb-6 max-w-prose mx-auto">
        Enter your Roblox game idea below, and our AI will provide a detailed,
        constructive analysis to help you make it a hit!
      </p>

      {/* Loading State */}
      {isLoading ? (
        <div className={`flex flex-col items-center justify-center h-96 transition-opacity duration-500 ${isContentVisible ? 'opacity-100' : 'opacity-0'}`}>
          <Loader2 className="h-12 w-12 text-purple-500 animate-spin" />
          <p className="mt-4 text-xl font-bold text-purple-400 animate-pulse">Analyzing...</p>
        </div>
      ) : (
         // Input Form
        <div className={`transition-opacity duration-500 ${isContentVisible ? 'opacity-100' : 'opacity-0'}`}>
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
                disabled={!idea.trim()}
                className="px-6 py-3 bg-purple-600 text-white font-bold rounded-full shadow-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center space-x-2 cursor-pointer"
              >
                <Rocket className="h-5 w-5" />
                <span>Get Analysis</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-8 p-4 bg-red-800 text-white rounded-2xl border border-red-700">
          <p className="font-semibold">Error:</p>
          <p>{error}</p>
        </div>
      )}

      {/* Analysis Results */}
      {analysis && parsedAnalysis && (
        <div className="mt-8 space-y-6">
          <div className="flex items-center space-x-2 mb-4">
            <Sparkles className="h-6 w-6 text-yellow-400" />
            <h2 className="text-2xl font-bold text-white">AI Analysis</h2>
          </div>

          {/* --- NEW SCORE CARDS SECTION --- */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ScoreCard title="Virality Potential" scoreData={parsedAnalysis.viralityPotential} />
            <ScoreCard title="Originality" scoreData={parsedAnalysis.originality} />
            <ScoreCard title="Monetizability" scoreData={parsedAnalysis.monetizability} />
          </div>


          {/* Pros */}
          <CollapsibleSection
            icon={<ThumbsUp className="h-5 w-5 text-green-400" />}
            title="Pros"
          >
            <ReactMarkdown components={markdownComponents}>
              {parsedAnalysis?.pros}
            </ReactMarkdown>
          </CollapsibleSection>


          {/* Cons */}
          <CollapsibleSection
            icon={<ThumbsDown className="h-5 w-5 text-red-400" />}
            title="Cons"
          >
            <ReactMarkdown components={markdownComponents}>
              {parsedAnalysis?.cons}
            </ReactMarkdown>
          </CollapsibleSection>


          {/* Improvements */}
          <CollapsibleSection
            icon={<Lightbulb className="h-5 w-5 text-blue-400" />}
            title="Improvements"
          >
            <ReactMarkdown components={markdownComponents}>
              {parsedAnalysis?.improvements}
            </ReactMarkdown>
          </CollapsibleSection>

          {/* Monetization */}
          <CollapsibleSection
            icon={<TrendingUp className="h-5 w-5 text-yellow-400" />}
            title="Monetization Strategy"
          >
            <ReactMarkdown components={markdownComponents}>
              {parsedAnalysis?.monetization}
            </ReactMarkdown>
          </CollapsibleSection>


          {/* Promotion Strategies */}
          <CollapsibleSection
            icon={<Megaphone className="h-5 w-5 text-purple-400" />}
            title="Promotion Strategies"
          >
            <ReactMarkdown components={markdownComponents}>
              {parsedAnalysis?.promotion}
            </ReactMarkdown>
          </CollapsibleSection>

          {/* Deeper Look Divider */}
          <div className="flex items-center space-x-2 pt-4">
            <div className="h-px bg-gray-600 flex-grow"></div>
            <h2 className="text-xl font-bold text-gray-300">Deeper Look</h2>
            <div className="h-px bg-gray-600 flex-grow"></div>
          </div>

          {/* Target Audience */}
          <CollapsibleSection
            icon={<Users className="h-5 w-5 text-teal-400" />}
            title="Target Audience"
          >
            <ReactMarkdown components={markdownComponents}>
              {parsedAnalysis?.targetAudience}
            </ReactMarkdown>
          </CollapsibleSection>

          {/* Trend Alignment */}
          <CollapsibleSection
            icon={<Activity className="h-5 w-5 text-orange-400" />}
            title="Trend Alignment"
          >
            <ReactMarkdown components={markdownComponents}>
              {parsedAnalysis?.trendAlignment}
            </ReactMarkdown>
          </CollapsibleSection>

          {/* Comparative Analysis */}
          <CollapsibleSection
            icon={<Scaling className="h-5 w-5 text-indigo-400" />}
            title="Comparative Analysis"
          >
            <ReactMarkdown components={markdownComponents}>
              {parsedAnalysis?.comparativeAnalysis}
            </ReactMarkdown>
          </CollapsibleSection>

        </div>
      )}
    </div>
  );
};

export default AnalyzerTool;