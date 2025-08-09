// app/api/analyze/route.js
export async function POST(req) {
    try {
      const { idea } = await req.json();
  
      const prompt = `Analyze the following Roblox game idea. Provide a detailed, helpful, and constructive analysis in Markdown format. The analysis should include:
  
  **Overall Rating**: A short, catchy phrase and a numerical score out of 100 (e.g., "Highly Promising! Score: 90/100 🚀").
  
  **Pros**: A bulleted list highlighting the strengths.
  
  **Cons**: A bulleted list detailing potential weaknesses or challenges.
  
  **Improvements**: A bulleted list with actionable, creative suggestions.
  
  **Monetization Strategy**: A bulleted list with ideas for how the game could make Robux.
  
  Game Idea: "${idea}"`;
  
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-5-nano",
          messages: [
            {
              role: "system",
              content:
                `You are an AI assistant specialized in analyzing Roblox game ideas. You provide a detailed, helpful, and constructive analysis in Markdown format.
                You must output your response in the following exact Markdown structure:

                **Overall Rating**
                Score: [number]/100
                [Short explanation]

                **Pros**
                - Point 1
                - Point 2
                - Point 3

                **Cons**
                - Point 1
                - Point 2
                - Point 3

                **Improvements**
                - Point 1
                - Point 2
                - Point 3

                **Monetization Strategy**
                - Point 1
                - Point 2
                - Point 3

                Do not add any other sections or headings. Keep exactly these five headings in this order.
                `,
            },
            { role: "user", content: prompt },
          ],
          temperature: 1,
        }),
      });
  
      const data = await response.json();
  
      if (data.error) {
        return new Response(JSON.stringify({ error: data.error.message }), {
          status: 400,
        });
      }
  
      return new Response(JSON.stringify(data), { status: 200 });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
      });
    }
  }
  