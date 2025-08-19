'use client'
import React, { useState, useEffect } from 'react';
import { Sparkles, Handshake, Code, Gauge, Type, Bot, FileText, ChevronDown, CheckCircle, CircleX, Rocket } from 'lucide-react';
import Header from './header/page.jsx';
import LoginPage from './login/page.jsx';
import SignupPage from './sign-up/page.jsx';
import Dashboard from './dashboard/page.jsx';
import AnalyzerTool from './analyzer-tool/page.jsx';
import SettingsPage from './settings/page.jsx';
import GeneratorPage from './generator/page.jsx';
import CheckoutPage from './checkout/page.jsx';
import SuccessPage from './success/page.jsx';
import CancelPage from './cancel/page.jsx';
import { auth, onAuthStateChanged, db } from '../../firebase.js';
import { doc, onSnapshot } from 'firebase/firestore';


// Landing Page Component (No changes needed here)
const LandingPage = ({ onStartAnalysis, setCurrentPage }) => (
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
            className="px-8 py-4 bg-purple-600 text-white font-bold text-lg rounded-full shadow-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-300 flex items-center space-x-2 mx-auto cursor-pointer"
          >
            <Rocket className="h-6 w-6" />
            <span>Analyze Your Idea Now</span>
          </button>
        </div>
  
        {/* Pricing Section */}
        <div className="text-center space-y-6">
          <h2 className="text-4xl font-extrabold text-white tracking-tight">Our Plans</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div className="bg-gray-700 p-6 rounded-2xl border border-gray-600 flex flex-col">
              <h3 className="text-2xl font-bold text-white mb-2">Free Plan</h3>
              <p className="text-sm text-gray-400 mb-4">Perfect for getting started.</p>
              <div className="mb-4">
                <span className="text-4xl font-bold text-white">$0</span>
                <span className="text-gray-400"> / month</span>
              </div>
              <ul className="space-y-2 text-gray-300 flex-grow">
                <li className="flex items-center space-x-2"><CheckCircle className="h-5 w-5 text-green-400"/><span>5 analyses per month</span></li>
                <li className="flex items-center space-x-2"><CheckCircle className="h-5 w-5 text-green-400"/><span>Core analysis features</span></li>
                <li className="flex items-center space-x-2"><CircleX className="h-5 w-5 text-red-400"/><span>Deeper analysis</span></li>
              </ul>
              <button onClick={onStartAnalysis} className="mt-6 w-full px-4 py-2 bg-purple-600 text-white font-bold rounded-full shadow-lg hover:bg-purple-700 transition-all duration-300 cursor-pointer">Start for Free</button>
            </div>
            <div className="bg-gray-700 p-6 rounded-2xl border border-purple-500 flex flex-col shadow-lg">
              <h3 className="text-2xl font-bold text-yellow-400 mb-2">Pro Plan</h3>
              <p className="text-sm text-gray-400 mb-4">For serious game developers.</p>
              <div className="mb-4">
                <span className="text-4xl font-bold text-white">$10</span>
                <span className="text-gray-400"> / month</span>
              </div>
              <ul className="space-y-2 text-gray-300 flex-grow">
                <li className="flex items-center space-x-2"><CheckCircle className="h-5 w-5 text-green-400"/><span>50 analyses per month</span></li>
                <li className="flex items-center space-x-2"><CheckCircle className="h-5 w-5 text-green-400"/><span>Unlimited projects saved</span></li>
                <li className="flex items-center space-x-2"><CheckCircle className="h-5 w-5 text-green-400"/><span>Deeper analysis & Creative Assets</span></li>
                 <li className="flex items-center space-x-2"><CheckCircle className="h-5 w-5 text-green-400"/><span>AI Idea Generator</span></li>
              </ul>
              <button onClick={() => setCurrentPage('checkout')} className="mt-6 w-full px-4 py-2 bg-purple-600 text-white font-bold rounded-full shadow-lg hover:bg-purple-700 transition-all duration-300 cursor-pointer">Upgrade to Pro</button>
            </div>
            <div className="bg-gray-700 p-6 rounded-2xl border border-gray-600 flex flex-col">
              <h3 className="text-2xl font-bold text-red-400 mb-2">Enterprise</h3>
              <p className="text-sm text-gray-400 mb-4">For teams and studios.</p>
              <div className="mb-4">
                <span className="text-4xl font-bold text-white">$30</span>
                <span className="text-gray-400"> / month</span>
              </div>
              <ul className="space-y-2 text-gray-300 flex-grow">
                <li className="flex items-center space-x-2"><CheckCircle className="h-5 w-5 text-green-400"/><span>Unlimited analyses</span></li>
                <li className="flex items-center space-x-2"><CheckCircle className="h-5 w-5 text-green-400"/><span>Shared workspaces</span></li>
                <li className="flex items-center space-x-2"><CheckCircle className="h-5 w-5 text-green-400"/><span>$5/additional member</span></li>
              </ul>
              <a href="mailto:rbxdiscover@gmail.com" className="mt-6 w-full text-center block px-4 py-2 bg-gray-600 text-white font-bold rounded-full shadow-lg hover:bg-gray-700 transition-all duration-300 cursor-pointer">Contact Us</a>
            </div>
          </div>
        </div>
        <div className="text-center space-y-6">
          <h2 className="text-4xl font-extrabold text-white tracking-tight">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-gray-700 rounded-2xl border border-gray-600">
              <Type className="h-10 w-10 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">1. Input Your Idea</h3>
              <p className="text-gray-300">Describe your Roblox game concept in detail in the text box provided.</p>
            </div>
            <div className="p-6 bg-gray-700 rounded-2xl border border-gray-600">
              <Bot className="h-10 w-10 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">2. AI Analysis</h3>
              <p className="text-gray-300">Our AI evaluates your idea for originality, potential, and market viability.</p>
            </div>
            <div className="p-6 bg-gray-700 rounded-2xl border border-gray-600">
              <FileText className="h-10 w-10 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">3. Get Your Report</h3>
              <p className="text-gray-300">Receive an instant, detailed report with ratings, pros, cons, and improvements.</p>
            </div>
          </div>
        </div>
        <div className="text-center space-y-6">
          <h2 className="text-4xl font-extrabold text-white tracking-tight">FAQ</h2>
          <div className="text-left w-full max-w-2xl mx-auto space-y-4">
            <details className="bg-gray-700 rounded-2xl p-4 cursor-pointer group transition-all duration-300 open:bg-purple-800 open:text-white">
              <summary className="flex items-center justify-between font-semibold text-lg text-white group-open:text-yellow-400 transition-colors duration-300">How does the AI generate an analysis?<ChevronDown className="h-6 w-6 transform group-open:rotate-180 transition-transform duration-300" /></summary>
              <p className="mt-4 text-gray-300 group-open:text-purple-100">Our AI is trained on a vast amount of data related to game design, user engagement, and current trends within the Roblox platform. It uses this knowledge to provide a constructive and detailed evaluation of your idea.</p>
            </details>
            <details className="bg-gray-700 rounded-2xl p-4 cursor-pointer group transition-all duration-300 open:bg-purple-800 open:text-white">
              <summary className="flex items-center justify-between font-semibold text-lg text-white group-open:text-yellow-400 transition-colors duration-300">Is my game idea safe and private?<ChevronDown className="h-6 w-6 transform group-open:rotate-180 transition-transform duration-300" /></summary>
              <p className="mt-4 text-gray-300 group-open:text-purple-100">Yes, your ideas are completely private. We do not store or share the game ideas you submit. The AI processes the information to generate a response, but your data is not saved.</p>
            </details>
            <details className="bg-gray-700 rounded-2xl p-4 cursor-pointer group transition-all duration-300 open:bg-purple-800 open:text-white">
              <summary className="flex items-center justify-between font-semibold text-lg text-white group-open:text-yellow-400 transition-colors duration-300">Can the AI help with multiple ideas at once?<ChevronDown className="h-6 w-6 transform group-open:rotate-180 transition-transform duration-300" /></summary>
              <p className="mt-4 text-gray-300 group-open:text-purple-100">Our tool is designed to analyze one idea at a time to ensure the most detailed and focused feedback. Please submit each idea individually to get the best results.</p>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
  
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
    const [selectedProject, setSelectedProject] = useState(null);
    const [userTier, setUserTier] = useState('free');
    const [usage, setUsage] = useState({ count: 0, limit: 5 });
  
    // --- THE FIX IS HERE ---
    useEffect(() => {
      setDbInstance(db);
      setAuthInstance(auth);
      
      // Initialize an empty unsubscribe function for the user listener
      let unsubscribeUser = () => {};

      const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        setIsAuthReady(true);
        if (currentUser) {
            const userDocRef = doc(db, 'users', currentUser.uid);
            // Assign the real unsubscribe function when the user logs in
            unsubscribeUser = onSnapshot(userDocRef, (doc) => {
                if (doc.exists()) {
                    const data = doc.data();
                    const tier = data.tier || 'free';
                    setUserTier(tier);
                    setUsage({
                        count: data.analysisCount || 0,
                        limit: tier === 'pro' ? 50 : 5
                    });
                } else {
                    // This case handles a lag between auth and Firestore creation
                    setUserTier('free');
                    setUsage({ count: 0, limit: 5 });
                }
            }, (error) => {
                console.error("Error in user snapshot listener:", error);
            });
            
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.has('session_id')) {
                setCurrentPage('success');
            } else if (urlParams.has('canceled')) {
                setCurrentPage('cancel');
            } else if (currentPage === 'landing' || currentPage === 'login' || currentPage === 'signup') {
                setCurrentPage('dashboard');
            }
        } else {
            // When the user logs out, call the unsubscribe function to detach the listener
            unsubscribeUser();
            setUserTier('free');
            setCurrentPage('landing');
        }
      });
  
      // This is the main cleanup function for the useEffect hook
      return () => {
        unsubscribeAuth(); // Clean up the auth listener
        unsubscribeUser(); // Also clean up the user listener here to be safe
      };
    }, []); // An empty dependency array ensures this runs only once on mount
  
    const handleLogout = async () => {
      if (authInstance) {
        // setCurrentPage('landing') is already handled by onAuthStateChanged
        setIdea('');
        setAnalysis(null);
        setSelectedProject(null);
        await auth.signOut();
      }
    };
  
    const handleLoginSuccess = () => {
      setCurrentPage('dashboard');
    };
  
    const handleStartAnalysis = () => {
      if (user) {
        setCurrentPage('analyzer');
      } else {
        setCurrentPage('login');
      }
    };

    const onStartNewProject = () => {
      setSelectedProject(null);
      setIdea('');
      setAnalysis(null);
      setCurrentPage('analyzer');
    };
  
    const onProjectSelect = (project) => {
      setSelectedProject(project);
      setIdea(project.idea);
      setAnalysis(project.analysis);
      setCurrentPage('analyzer');
    };

    const handleIdeaGenerated = (generatedIdea) => {
        setIdea(generatedIdea);
        setAnalysis(null);
        setSelectedProject(null);
        setCurrentPage('analyzer');
    };
  
    let content;
    if (!isAuthReady) {
      content = <div className="flex items-center justify-center min-h-screen text-white">Loading Application...</div>;
    } else {
      switch (currentPage) {
        case 'landing':
          content = <LandingPage onStartAnalysis={handleStartAnalysis} setCurrentPage={setCurrentPage} />;
          break;
        case 'analyzer':
          content = <AnalyzerTool 
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
          selectedProject={selectedProject} // Pass the whole object
          setCurrentPage={setCurrentPage} 
          userTier={userTier} 
        />;          
          break;
        case 'dashboard':
          content = <Dashboard setCurrentPage={setCurrentPage} db={dbInstance} user={user} onProjectSelect={onProjectSelect} onStartNewProject={onStartNewProject} userTier={userTier} usage={usage} />;
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
        case 'generator':
            if (userTier === 'pro') {
                content = <GeneratorPage setCurrentPage={setCurrentPage} onIdeaGenerated={handleIdeaGenerated} />;
            } else {
                content = <div className="text-center p-10">
                    <h2 className="text-3xl font-bold text-white mb-4">This is a Pro Feature!</h2>
                    <p className="text-gray-400 mb-6">Upgrade to Pro to use the AI Idea Generator.</p>
                    <button onClick={() => setCurrentPage('checkout')} className="px-6 py-3 bg-purple-600 text-white font-bold rounded-full">Upgrade Now</button>
                </div>;
            }
            break;
        case 'checkout':
            content = <CheckoutPage setCurrentPage={setCurrentPage} user={user} />;
            break;
        case 'success':
            content = <SuccessPage setCurrentPage={setCurrentPage} />;
            break;
        case 'cancel':
            content = <CancelPage setCurrentPage={setCurrentPage} />;
            break;
        default:
          content = <LandingPage onStartAnalysis={handleStartAnalysis} setCurrentPage={setCurrentPage} />;
      }
    }
  
    return (
      <div className="min-h-screen bg-gray-900 text-gray-200 font-inter">
        <Header setCurrentPage={setCurrentPage} userIsAuthenticated={!!user} onLogout={handleLogout} />
        {content}
      </div>
    );
}

export default App;