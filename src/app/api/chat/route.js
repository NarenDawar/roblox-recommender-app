// api/chat/route.js
// Use import for availableGames in App Router Route Handlers
import availableGames from '../../../../utility/roblox_games_data.json';
import { NextResponse } from 'next/server'; // Import NextResponse

// This function will handle POST requests
export async function POST(request) { // Use 'request' instead of 'req'
    // Extract messages from the request body
    const { messages: clientMessages } = await request.json(); // 'request' object from next/server has a .json() method

    const openRouterApiKey = process.env.OPENROUTER_API_KEY_2;

    if (!openRouterApiKey) {
        return NextResponse.json({ message: "Server: OpenRouter API Key is not set." }, { status: 500 });
    }

    try {
        const chatHistory = [
            {
                role: 'system',
                content: `// src/app/api/chat/route.js - System Prompt Content

                You are an ultra-strict Roblox game recommender.
                Your ONLY source of information and your ONLY task is to suggest games **EXCLUSIVELY** from the "availableGames" list provided below.

                **ABSOLUTELY CRITICAL: YOU MUST NOT, UNDER ANY CIRCUMSTANCES, MENTION, SUGGEST, OR REFER TO ANY GAME NOT PRESENT IN THE "availableGames" LIST. DO NOT INVENT, FABRICATE, OR HALLUCINATE ANY GAME NAMES OR DETAILS.**

                Based on the user's description, find the 1 to 3 BEST matches *from the provided list only*. Consider game titles, genres, play-styles, and themes.

                For each recommendation, present the information using **ONLY** the data points found in the list, formatted as:
                * **Game Name**: [EXACT Name from list]
                * **Brief Reason for Recommendation**: [Explain *why* it matches, based *only* on the game's properties in the list, e.g., "Matches 'simulation' genre and 'casual' playstyle." Keep it concise.]
                * **Relevant Genre(s)**: [EXACT Genres from list]
                * **Relevant Play Style(s)**: [EXACT Play styles from list]
                * **Theme(s)**: [EXACT Themes from list]

                Bold the left side of all colons.

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
            model: "deepseek/deepseek-r1-0528-qwen3-8b:free",
            messages: chatHistory,
            stream: false,
        };

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openRouterApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API error from OpenRouter: ${response.status} - ${errorData.message || response.statusText}`);
        }

        const data = await response.json();
        return NextResponse.json(data, { status: 200 }); 

    } catch (error) {
        console.error("Error in API route:", error);
        return NextResponse.json({ message: `Internal server error: ${error.message}` }, { status: 500 });
    }
}

// If you need to handle other HTTP methods, you'd export them similarly:
// export async function GET(request) { ... }
// export async function PUT(request) { ... }
// export async function DELETE(request) { ... }