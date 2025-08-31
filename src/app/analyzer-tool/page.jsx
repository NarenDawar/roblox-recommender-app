// app/analyzer-tool/page.jsx

"use client";

import React, { useState, useCallback, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Sparkles, Loader2, Rocket, ThumbsUp, ThumbsDown, Lightbulb, TrendingUp, Megaphone, ArrowLeft, ChevronDown, Users, Activity, Scaling, Palette, Download, Lock } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// ... (parseAnalysis remains the same)
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
      creativeAssets: '',
    };

    const lines = markdown.split('\n');
    let currentSection = '';

    for (const line of lines) {
      const cleanLine = line.trim().toLowerCase();

      if (cleanLine.match(/virality\s*potential/)) currentSection = 'viralityPotential';
      else if (cleanLine.match(/^(\*{0,2}|#+)?\s*originality/)) currentSection = 'originality';
      else if (cleanLine.match(/^(\*{0,2}|#+)?\s*monetizability/)) currentSection = 'monetizability';
      else if (cleanLine.match(/^(\*{0,2}|#+)?\s*pros/)) currentSection = 'pros';
      else if (cleanLine.match(/^(\*{0,2}|#+)?\s*cons/)) currentSection = 'cons';
      else if (cleanLine.match(/^(\*{0,2}|#+)?\s*improvements/)) currentSection = 'improvements';
      else if (cleanLine.match(/^(\*{0,2}|#+)?\s*monetization/)) currentSection = 'monetization';
      else if (cleanLine.match(/^(\*{0,2}|#+)?\s*promotion/)) currentSection = 'promotion';
      else if (cleanLine.match(/^(\*{0,2}|#+)?\s*target/)) currentSection = 'targetAudience';
      else if (cleanLine.match(/^(\*{0,2}|#+)?\s*trend/)) currentSection = 'trendAlignment';
      else if (cleanLine.match(/^(\*{0,2}|#+)?\s*comparative/)) currentSection = 'comparativeAnalysis';
      else if (cleanLine.match(/^(\*{0,2}|#+)?\s*creative\s*assets/)) currentSection = 'creativeAssets';
      else if (line.trim() !== '' && currentSection) sections[currentSection] += line + '\n';
    }

    for (const key in sections) {
        if (['viralityPotential', 'originality', 'monetizability'].includes(key)) {
            const scoreMatch = sections[key].match(/Score:\s*(\d+)\/10/);
            if (scoreMatch) {
              sections[key] = { text: sections[key].replace(/Score:\s*\d+\/10/, '').trim(), score: scoreMatch[1] };
            } else {
               sections[key] = { text: sections[key], score: null };
            }
        }
    }
    return sections;
};


// **FIX: CollapsibleSection now accepts an isDisabled prop**
const CollapsibleSection = ({ icon, title, children, isDisabled = false }) => {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <div className="bg-gray-700 rounded-2xl border border-gray-600">
      <button
        className={`w-full flex items-center justify-between p-6 ${isDisabled ? 'cursor-default' : 'cursor-pointer'}`}
        onClick={() => !isDisabled && setIsOpen(!isOpen)}
        disabled={isDisabled}
      >
        <h3 className="text-xl font-bold text-white flex items-center space-x-2">{icon}<span>{title}</span></h3>
        <ChevronDown className={`h-6 w-6 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && <div className="px-6 pb-6 prose prose-invert max-w-none">{children}</div>}
    </div>
  );
};

// --- FIX IS HERE ---
// Provide a default empty string for the 'idea' prop to prevent build errors.
const AnalyzerTool = ({ idea = '', setIdea, analysis, setAnalysis, isLoading, setIsLoading, error, setError, db, user, selectedProject, setCurrentPage, userTier }) => {
  const [appId] = useState('roblox-analyzer');
  const [parsedAnalysis, setParsedAnalysis] = useState(null);

  const getScoreColor = (score) => {
    if (score === null || isNaN(score)) return 'text-gray-400';
    if (score >= 8) return 'text-green-400';
    if (score >= 5) return 'text-yellow-400';
    return 'text-red-400';
  };

  useEffect(() => {
    if (selectedProject) {
      setAnalysis(selectedProject.analysis);
      setParsedAnalysis(selectedProject.analysis ? parseAnalysis(selectedProject.analysis) : null);
      setIdea(selectedProject.idea || '');
    }
  }, [selectedProject, setAnalysis, setIdea]);

    const handleExport = async () => {
    if (!analysis) return;

    const { default: jsPDF } = await import('jspdf');
    const pdf = new jsPDF('p', 'pt', 'a4');

    // --- EMOJI MAPPING FOR HEADINGS ---
    const emojiMap = {
        'Game Idea': '🎮',
        'Core Metrics': '📊',
        'Pros': '👍',
        'Cons': '👎',
        'Actionable Improvements': '💡',
        'Monetization Strategy': '💰',
        'Promotion Strategies': '📢',
        'Creative Assets': '🎨',
        'Target Audience': '👥',
        'Trend Alignment': '📈',
        'Comparative Analysis': '🔍'
    };

    // Register fonts (assuming you have these in your public/fonts folder)
    try {
        const fontBytes = await fetch("/fonts/Montserrat-Regular.ttf").then(r => r.arrayBuffer());
        const base64 = btoa(String.fromCharCode(...new Uint8Array(fontBytes)));
        pdf.addFileToVFS("Montserrat-Regular.ttf", base64);
        pdf.addFont("Montserrat-Regular.ttf", "Montserrat", "normal");

        const fontBytes2 = await fetch("/fonts/Montserrat-Bold.ttf").then(r => r.arrayBuffer());
        const base64_2 = btoa(String.fromCharCode(...new Uint8Array(fontBytes2)));
        pdf.addFileToVFS("Montserrat-Bold.ttf", base64_2);
        pdf.addFont("Montserrat-Bold.ttf", "Montserrat", "bold");
    } catch (error) {
        console.error("Error loading fonts:", error);
    }

    // --- DESIGN CONSTANTS ---
    const page = {
        width: pdf.internal.pageSize.getWidth(),
        height: pdf.internal.pageSize.getHeight(),
        margin: 40,
        contentWidth: pdf.internal.pageSize.getWidth() - 80,
    };

    const colors = {
        background: '#111827',
        primary: '#8B5CF6',
        secondary: '#FBBF24',
        text: '#E5E7EB',
        subtle: '#4B5563',
    };

    let y = page.margin;
    let pageCount = 1;

    // --- HELPER FUNCTIONS ---
    const addPageIfNeeded = (spaceNeeded) => {
        if (y + spaceNeeded > page.height - page.margin) {
            addFooter();
            pdf.addPage();
            pageCount++;
            pdf.setFillColor(colors.background);
            pdf.rect(0, 0, page.width, page.height, 'F');
            addHeader();
            y = page.margin + 40;
        }
    };

    const addHeader = () => {
        pdf.setFillColor(colors.primary);
        pdf.rect(0, 0, page.width, page.margin + 10, 'F');
        pdf.setFont('Montserrat', 'bold');
        pdf.setFontSize(16);
        pdf.setTextColor(colors.text);
        pdf.text('Roblox Idea Analysis', page.margin, page.margin - 5);
    };

    const addFooter = () => {
        pdf.setFont('Montserrat', 'normal');
        pdf.setFontSize(8);
        pdf.setTextColor(colors.subtle);
        const footerText = `Page ${pageCount} | Generated by Roblox Analyzer`;
        const textWidth = pdf.getStringUnitWidth(footerText) * 8 / pdf.internal.scaleFactor;
        pdf.text(footerText, (page.width - textWidth) / 2, page.height - 20);
    };

    const addTitle = (text) => {
        addPageIfNeeded(50);
        pdf.setFont('Montserrat', 'bold');
        pdf.setFontSize(26);
        pdf.setTextColor(colors.primary);
        const textLines = pdf.splitTextToSize(text, page.contentWidth);
        pdf.text(textLines, page.margin, y);
        y += (textLines.length * 26) + 10;
        addSectionDivider();
    };

    const addHeading = (text) => {
        addPageIfNeeded(40);
        pdf.setFont('Montserrat', 'bold');
        pdf.setFontSize(18);
        pdf.setTextColor(colors.secondary);
        const emoji = emojiMap[text] ? `${emojiMap[text]} ` : '';
        pdf.text(emoji + text, page.margin, y);
        y += 30;
    };

    const addSectionDivider = () => {
        addPageIfNeeded(20);
        pdf.setDrawColor(colors.subtle);
        pdf.line(page.margin, y, page.width - page.margin, y);
        y += 20;
    };

    const addBody = (text) => {
        if (!text || text.trim() === '') return;
        addPageIfNeeded(20);
        pdf.setFont('Montserrat', 'normal');
        pdf.setFontSize(10);
        pdf.setTextColor(colors.text);
        const cleanedText = text.replace(/^-/gm, '•');
        const textLines = pdf.splitTextToSize(cleanedText, page.contentWidth);
        pdf.text(textLines, page.margin, y);
        y += (textLines.length * 12) + 20;
    };

    const addScoreCards = (virality, originality, monetizability) => {
        addPageIfNeeded(100);
        const cardWidth = (page.contentWidth - 20) / 3;
        const cardHeight = 80;
        const scoreData = [
            { title: 'Virality', ...virality },
            { title: 'Originality', ...originality },
            { title: 'Monetizability', ...monetizability },
        ];

        scoreData.forEach((item, index) => {
            const x = page.margin + index * (cardWidth + 10);
            pdf.setFillColor(colors.subtle);
            pdf.roundedRect(x, y, cardWidth, cardHeight, 10, 10, 'F');
            pdf.setFont('Montserrat', 'bold');
            pdf.setFontSize(12);
            pdf.setTextColor(colors.secondary);
            pdf.text(item.title, x + 10, y + 20);
            pdf.setFontSize(24);
            pdf.setTextColor(colors.text);
            pdf.text(`${item.score || 'N/A'}/10`, x + cardWidth - 10, y + cardHeight - 15, { align: 'right' });
        });
        y += cardHeight + 20;
    };

    // --- PDF GENERATION ---
    pdf.setFillColor(colors.background);
    pdf.rect(0, 0, page.width, page.height, 'F');
    addHeader();
    y = page.margin + 40;

    addTitle('Game Design Document');

    addHeading('Game Idea');
    addBody(idea);
    addSectionDivider();

    const parsed = parseAnalysis(analysis);

    addHeading('Core Metrics');
    addScoreCards(parsed.viralityPotential, parsed.originality, parsed.monetizability);
    addSectionDivider();

    addHeading('Pros');
    addBody(parsed.pros);
    addSectionDivider();

    addHeading('Cons');
    addBody(parsed.cons);
    addSectionDivider();

    addHeading('Actionable Improvements');
    addBody(parsed.improvements);
    addSectionDivider();

    addHeading('Monetization Strategy');
    addBody(parsed.monetization);
    addSectionDivider();

    addHeading('Promotion Strategies');
    addBody(parsed.promotion);
    addSectionDivider();

    addHeading('Creative Assets');
    addBody(parsed.creativeAssets);
    addSectionDivider();

    addHeading('Target Audience');
    addBody(parsed.targetAudience);
    addSectionDivider();

    addHeading('Trend Alignment');
    addBody(parsed.trendAlignment);
    addSectionDivider();

    addHeading('Comparative Analysis');
    addBody(parsed.comparativeAnalysis);

    addFooter();

    const fileName = idea.substring(0, 30).replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'game_idea';
    pdf.save(`${fileName}_gdd.pdf`);
};

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setAnalysis(null);
    setParsedAnalysis(null);
    setError(null);

    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
        setError("You must be logged in to get an analysis.");
        setIsLoading(false);
        return;
    }

    try {
      const token = await currentUser.getIdToken();

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ idea }),
      });

      if (response.status === 401) {
        setError("Authentication failed. Please log in again.");
        setIsLoading(false);
        return;
      }
      if (response.status === 429) {
        setError("You've reached your monthly analysis limit. Please upgrade for more.");
        setIsLoading(false);
        return;
      }

      const result = await response.json();

      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.choices && result.choices.length > 0) {
        const generatedAnalysis = result.choices[0].message.content;
        setAnalysis(generatedAnalysis);
        setParsedAnalysis(parseAnalysis(generatedAnalysis));

        if (db && user) {
          const projectsRef = collection(db, `artifacts/${appId}/users/${user.uid}/projects`);
          await addDoc(projectsRef, {
              idea,
              analysis: generatedAnalysis,
              createdAt: new Date(),
              isPublic: true,
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
    }
  }, [idea, setAnalysis, setIsLoading, setError, db, user, appId]);

  const markdownComponents = {
    ul: ({node, ...props}) => <ul {...props} className="list-none space-y-1" />,
    li: ({node, ...props}) => <li {...props} className="before:content-['-'] before:text-gray-300 before:mr-2 text-gray-300" />,
  };

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
       <div className="flex justify-between items-center mb-4">
        <button onClick={() => setCurrentPage('dashboard')} className="p-2 text-white rounded-full hover:bg-gray-700 transition-colors duration-300 cursor-pointer"><ArrowLeft className="h-6 w-6" /></button>
        <div className="flex items-center space-x-2 flex-grow justify-center">
          <Sparkles className="h-8 w-8 text-yellow-400" />
          <h1 className="text-4xl font-extrabold text-white tracking-tight">Roblox Idea Analyzer</h1>
        </div>
        <div className="w-10"></div>
      </div>
      <p className="text-center text-gray-400 mb-6 max-w-prose mx-auto">
        Enter your Roblox game idea below, and our AI will provide a detailed, constructive analysis to help you make it a hit!
      </p>

      {!analysis && !isLoading && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            className="w-full h-48 p-4 text-gray-200 bg-gray-700 border border-gray-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none transition-all duration-300 placeholder-gray-400"
            placeholder="Describe your Roblox game idea here..."
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            required
            disabled={isLoading}
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
      )}


      {isLoading && (
        <div className="flex flex-col items-center justify-center h-12 mt-4">
          <Loader2 className="h-8 w-8 text-purple-500 animate-spin" />
          <p className="mt-2 text-sm font-bold text-purple-400">Analyzing...</p>
        </div>
      )}


      {error && (
        <div className="mt-8 p-4 bg-red-800 text-white rounded-2xl border border-red-700">
          <p className="font-semibold">Error:</p>
          <p>{error}</p>
        </div>
      )}

      <div id="analysis-report">
        {!isLoading && analysis && parsedAnalysis && (
          <div className="mt-8 space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                    <Sparkles className="h-6 w-6 text-yellow-400" />
                    <h2 className="text-2xl font-bold text-white">AI Analysis Report</h2>
                </div>
                <div className="flex items-center space-x-2">
                    {userTier !== 'free' ? (
                      <button
                          onClick={handleExport}
                          className="px-4 py-2 bg-green-600 text-white font-bold rounded-full shadow-lg hover:bg-green-700 flex items-center space-x-2 cursor-pointer"
                      >
                          <Download className="h-5 w-5" />
                          <span>Export GDD</span>
                      </button>
                    ) : (
                      <button
                          onClick={() => setCurrentPage('checkout')}
                          className="px-4 py-2 bg-gray-600 text-white font-bold rounded-full shadow-inner flex items-center space-x-2 cursor-pointer"
                          title="Upgrade to Pro to export as PDF"
                      >
                          <Lock className="h-5 w-5" />
                          <span>Export GDD</span>
                      </button>
                    )}

                </div>
            </div>

            <div className="bg-gray-700 p-6 rounded-2xl border border-gray-600">
                <h3 className="text-xl font-bold text-white mb-2">Game Idea</h3>
                <p className="text-gray-300 whitespace-pre-wrap">{idea}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ScoreCard title="Virality Potential" scoreData={parsedAnalysis.viralityPotential} />
              <ScoreCard title="Originality" scoreData={parsedAnalysis.originality} />
              <ScoreCard title="Monetizability" scoreData={parsedAnalysis.monetizability} />
            </div>
            <CollapsibleSection icon={<ThumbsUp className="h-5 w-5 text-green-400" />} title="Pros"><ReactMarkdown components={markdownComponents}>{parsedAnalysis?.pros}</ReactMarkdown></CollapsibleSection>
            <CollapsibleSection icon={<ThumbsDown className="h-5 w-5 text-red-400" />} title="Cons"><ReactMarkdown components={markdownComponents}>{parsedAnalysis?.cons}</ReactMarkdown></CollapsibleSection>
            <CollapsibleSection icon={<Lightbulb className="h-5 w-5 text-blue-400" />} title="Improvements"><ReactMarkdown components={markdownComponents}>{parsedAnalysis?.improvements}</ReactMarkdown></CollapsibleSection>
            <CollapsibleSection icon={<Palette className="h-5 w-5 text-pink-400" />} title="Creative Assets"><ReactMarkdown components={markdownComponents}>{parsedAnalysis?.creativeAssets}</ReactMarkdown></CollapsibleSection>
            <CollapsibleSection icon={<TrendingUp className="h-5 w-5 text-yellow-400" />} title="Monetization Strategy"><ReactMarkdown components={markdownComponents}>{parsedAnalysis?.monetization}</ReactMarkdown></CollapsibleSection>
            <CollapsibleSection icon={<Megaphone className="h-5 w-5 text-purple-400" />} title="Promotion Strategies"><ReactMarkdown components={markdownComponents}>{parsedAnalysis?.promotion}</ReactMarkdown></CollapsibleSection>

            <div className="flex items-center space-x-2 pt-4">
              <div className="h-px bg-gray-600 flex-grow"></div>
              <h2 className="text-xl font-bold text-gray-300">Deeper Look</h2>
              <div className="h-px bg-gray-600 flex-grow"></div>
            </div>

            {userTier === 'free' ? (
                <div className="relative bg-gray-700 p-10 rounded-2xl border border-dashed border-gray-600 text-center">
                    {/* **FIX: The blur and the upgrade button are now correctly layered using z-index** */}
                    <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex flex-col items-center justify-center rounded-2xl z-10">
                        <Lock className="h-12 w-12 text-yellow-400 mb-4" />
                        <h3 className="text-2xl font-bold text-white mb-2">This is a Pro Feature</h3>
                        <p className="text-gray-300 mb-6">Upgrade to unlock the Deeper Look analysis.</p>
                        <button onClick={() => setCurrentPage('checkout')} className="px-6 py-3 bg-purple-600 text-white font-bold rounded-full shadow-lg hover:bg-purple-700">
                            Upgrade to Pro
                        </button>
                    </div>
                    <div className="opacity-20">
                        {/* **FIX: The CollapsibleSection components are now disabled for free users** */}
                        <CollapsibleSection icon={<Users className="h-5 w-5 text-teal-400" />} title="Target Audience" isDisabled={true} />
                        <div className="mt-4"><CollapsibleSection icon={<Activity className="h-5 w-5 text-orange-400" />} title="Trend Alignment" isDisabled={true} /></div>
                        <div className="mt-4"><CollapsibleSection icon={<Scaling className="h-5 w-5 text-indigo-400" />} title="Comparative Analysis" isDisabled={true} /></div>
                    </div>
                </div>
            ) : (
                <>
                    <CollapsibleSection icon={<Users className="h-5 w-5 text-teal-400" />} title="Target Audience"><ReactMarkdown components={markdownComponents}>{parsedAnalysis?.targetAudience}</ReactMarkdown></CollapsibleSection>
                    <CollapsibleSection icon={<Activity className="h-5 w-5 text-orange-400" />} title="Trend Alignment"><ReactMarkdown components={markdownComponents}>{parsedAnalysis?.trendAlignment}</ReactMarkdown></CollapsibleSection>
                    <CollapsibleSection icon={<Scaling className="h-5 w-5 text-indigo-400" />} title="Comparative Analysis"><ReactMarkdown components={markdownComponents}>{parsedAnalysis?.comparativeAnalysis}</ReactMarkdown></CollapsibleSection>
                </>
            )}

          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyzerTool;