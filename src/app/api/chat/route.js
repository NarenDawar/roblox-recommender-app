// api/chat/route.js
// Use import for availableGames in App Router Route Handlers
import availableGames from '../../../../utility/roblox_games_data.json';
import { NextResponse } from 'next/server';

// This function will handle POST requests
export async function POST(request) {
    // Extract messages from the request body
    const { messages: clientMessages } = await request.json();

    // Use the OpenAI API Key environment variable
    const openaiApiKey = process.env.OPENAI_API_KEY; // Renamed variable

    if (!openaiApiKey) {
        return NextResponse.json({ message: "Server: OpenAI API Key is not set." }, { status: 500 });
    }

    try {
        const chatHistory = [
            {
                role: 'system',
                content: `

                You are an ultra-strict Roblox game recommender.
                Your ONLY source of information and your ONLY task is to suggest games **EXCLUSIVELY** from the list I provide below.

                **ABSOLUTELY CRITICAL: YOU MUST NOT, UNDER ANY CIRCUMSTANCES, MENTION, SUGGEST, OR REFER TO ANY GAME NOT PRESENT IN THE LIST. DO NOT INVENT, FABRICATE, OR HALLUCINATE ANY GAME NAMES OR DETAILS. DO NOT REPEAT GAMES.**

                Based on the user's description, find the 1 to 3 BEST matches *from the provided list only*. Consider game titles, genres, play-styles, and themes.

                **STRICT FALLBACK RULE:**
                If, after thoroughly checking the entire "availableGames" list, you cannot find *any* suitable games that are a close match for the user's request, you **MUST** respond with *only* the following specific phrase:
                "I couldn't find any close matches from my database based on your request. Please try a different description or keyword. I can only recommend games from my verified list."
                DO NOT provide alternative suggestions if no close match is found, as this leads to hallucinations.

                **STRICT IRRELEVANT QUERY RULE:**
                If a user's query is not related to Roblox games or game recommendations (e.g., "Tell me a joke," "What's the capital of France?"), you **MUST** respond with *only* the following specific phrase:
                "I am a Roblox Explorer agent, please ask me more relevant questions."

                Here is the comprehensive and exclusive list of available Roblox Games (JSON format, this is your ONLY source):
                ${JSON.stringify(availableGames)}`
            },
            ...clientMessages
        ];

        const payload = {
            model: "gpt-4o-mini", // Recommended model for cost-effectiveness and performance
            // You could also use "gpt-4" or "gpt-4o" for higher quality but higher cost
            messages: chatHistory,
            stream: false, // Keep false as per your current setup
            temperature: 1.5, // Add temperature for creativity (0.0 for strict, 1.0 for creative)
            max_tokens: 300 // Limit output tokens to control cost and verbosity
        };

        const response = await fetch('https://api.openai.com/v1/chat/completions', { // OpenAI API Endpoint
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openaiApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorData = await response.json();
            // OpenAI errors often have 'error.message'
            throw new Error(`API error from OpenAI: ${response.status} - ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        return NextResponse.json(data, { status: 200 });

    } catch (error) {
        console.error("Error in API route:", error);
        return NextResponse.json({ message: `Internal server error: ${error.message}` }, { status: 500 });
    }
}