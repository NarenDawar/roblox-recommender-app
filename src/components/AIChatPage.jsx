// components/AIChatPage.jsx
'use client';

import React, { useState, useRef, useEffect } from 'react';

// IMPORTANT: Replace with your actual OpenRouter API Key.
// This key should ideally be loaded from a secure environment variable in a real application.
const OPENROUTER_API_KEY = "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"; // <<<--- ADD YOUR OPENROUTER API KEY HERE

// Helper function to render basic Markdown (bold, italics) to HTML
const renderMarkdown = (markdownText) => {
  let html = markdownText;

  // Convert bold: **text** to <strong>text</strong>
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Convert italics: *text* to <em>text</em>
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  // Convert newlines to <br> tags for basic line breaks
  html = html.replace(/\n/g, '<br />');

  return html;
};


const AIChatPage = ({ user, aiRequestCount, setAiRequestCount, guestLimit, setAuthMode, setShowAuthModal, onBackToHome }) => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hello! I'm your Roblox game AI recommender. Tell me about the kind of game you're looking for, or describe a game you like, and I'll suggest 1-3 games for you." }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Scroll to the bottom of the chat on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Check if the user is a guest and has exceeded the limit
  // isGuestLimited is now always false, effectively removing the limit
  const isGuestLimited = false; // Removed guest limit for now

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading || isGuestLimited) return;

    const userMessage = { role: 'user', content: inputMessage };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    // No longer incrementing guest request count as the limit is removed
    // if (!user) {
    //   setAiRequestCount(prevCount => prevCount + 1);
    // }

    try {
      if (!OPENROUTER_API_KEY) {
        throw new Error("OpenRouter API Key is not set. Please add it to components/AIChatPage.jsx");
      }

      const chatHistory = [
        { role: 'system', content: ```You are a helpful Roblox game AI recommender. Based on the user's description, suggest 1 to 3 Roblox games that match their preferences. 
            Provide the game name, a brief reason for the recommendation, and if possible, a relevant genre or playstyle. Be concise and focus on direct recommendations. 
            If you cannot find a suitable game, politely state that and offer to try again with a different description.
            When recommending a game, verify that it exists on the Roblox platform at the time of the request and has active users. Otherwise, recommend a different relevant game.``` },
        ...messages, // Include previous messages for context
        userMessage // Add the current user message
      ];

      const payload = {
        model: "deepseek/deepseek-chat-v3-0324:free", // Using DeepSeek-V3 as requested
        messages: chatHistory,
        stream: false, // Canvas environment typically does not support streaming external LLM APIs
      };

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API error: ${response.status} - ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      const aiResponseContent = data.choices[0]?.message?.content || "Sorry, I couldn't generate a recommendation right now. Please try again.";
      setMessages((prevMessages) => [...prevMessages, { role: 'assistant', content: aiResponseContent }]);

    } catch (error) {
      console.error("Error fetching AI recommendation:", error);
      setMessages((prevMessages) => [
        ...prevMessages,
        { role: 'assistant', content: `Sorry, I encountered an error: ${error.message}. Please try again later.` }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-2xl w-full max-w-2xl transform transition-all duration-300">
      <div className="flex-none p-4 border-b border-gray-200 flex items-center justify-between">
        <button
          onClick={onBackToHome}
          className="bg-purple-500 text-white font-bold py-2 px-4 rounded-lg shadow hover:bg-purple-600 transition duration-200 ease-in-out text-base transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-white cursor-pointer"
        >
          ← Back to Recommender
        </button>
        <h2 className="text-2xl font-bold text-gray-800">AI Game Chat</h2>
        <div></div> {/* Placeholder for alignment */}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg shadow-md ${
                msg.role === 'user'
                  ? 'bg-blue-500 text-white rounded-br-none'
                  : 'bg-gray-100 text-gray-800 rounded-bl-none'
              }`}
            >
              {/* Render Markdown content using dangerouslySetInnerHTML */}
              <p className="text-sm" dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}></p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[80%] p-3 rounded-lg shadow-md bg-gray-100 text-gray-800 rounded-bl-none">
              <div className="flex items-center">
                <span className="animate-pulse text-sm">Thinking...</span>
                <svg className="animate-spin ml-2 h-4 w-4 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex-none p-4 border-t border-gray-200">
        {/* Removed the guest limit message as the limit is removed */}
        {/* {isGuestLimited && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-lg mb-4 text-center text-sm">
            You've used all {guestLimit} free AI requests. Please{' '}
            <button
              onClick={() => {
                setAuthMode('signup');
                setShowAuthModal(true);
              }}
              className="font-bold text-yellow-800 hover:underline"
            >
              Sign Up
            </button>{' '}
            for unlimited access!
          </div>
        )} */}
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            className="flex-1 px-4 py-2 rounded-lg border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800"
            placeholder={"Describe the game you're looking for..."} // Placeholder simplified
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            disabled={isLoading} // isGuestLimited removed from here
          />
          <button
            type="submit"
            className="bg-purple-500 text-white font-bold py-2 px-4 rounded-lg shadow hover:bg-purple-600 transition duration-200 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading} // isGuestLimited removed from here
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIChatPage;
