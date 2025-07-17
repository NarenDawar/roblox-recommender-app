// components/AIChatPage.jsx
'use client';

import React, { useState, useRef, useEffect } from 'react';

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


const AIChatPage = ({ user, aiRequestCount, guestLimit, setAuthMode, setShowAuthModal, onBackToHome }) => {
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

  // isGuestLimited is now always false, effectively removing the limit
  const isGuestLimited = false;

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading || isGuestLimited) return;
  
    const userMessage = { role: 'user', content: inputMessage };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInputMessage('');
    setIsLoading(true);
  
    try {
      // Send request to YOUR OWN API endpoint
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: [...messages, userMessage] }), // Send full chat history
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Our server error: ${response.status} - ${errorData.message || response.statusText}`);
      }
  
      const data = await response.json(); // This is the response from our API route
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
    <div className="flex flex-col h-full bg-white rounded-xl shadow-2xl w-full max-w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl xl:max-w-4xl mx-auto transform transition-all duration-300 my-4 sm:my-8">
      <div className="flex flex-col bg-white rounded-xl shadow-2xl w-full h-[70vh] max-h-[800px] sm:max-w-xl md:max-w-2xl lg:max-w-3xl xl:max-w-4xl mx-auto"> {/* Added fixed height and max-height here */}
        <div className="flex-none p-3 sm:p-4 border-b border-gray-200 flex items-center justify-center">
          <h2 className="text-lg sm:text-2xl font-bold text-gray-800">AI Game Chat</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[80%] p-3 rounded-lg shadow-md ${
                  msg.role === 'user'
                    ? 'bg-blue-500 text-white rounded-br-none'
                    : 'bg-gray-100 text-gray-800 rounded-bl-none'
                }`}
              >
                <p className="text-sm sm:text-base" dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}></p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[85%] sm:max-w-[80%] p-3 rounded-lg shadow-md bg-gray-100 text-gray-800 rounded-bl-none">
                <div className="flex items-center">
                  <span className="animate-pulse text-sm sm:text-base">Thinking...</span>
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

        <div className="flex-none p-3 sm:p-4 border-t border-gray-200">
          <form onSubmit={handleSendMessage} className="flex gap-2 sm:gap-3">
            <input
              type="text"
              className="flex-1 px-3 py-2 sm:px-4 sm:py-2 rounded-lg border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800 text-sm sm:text-base"
              placeholder={"Describe the game you're looking for..."}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={isLoading}
            />
            <button
              type="submit"
              className="bg-purple-500 text-white font-bold py-2 px-3 sm:px-4 rounded-lg shadow hover:bg-purple-600 transition duration-200 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              disabled={isLoading}
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AIChatPage;