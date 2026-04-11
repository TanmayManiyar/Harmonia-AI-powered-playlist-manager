import { GoogleGenAI } from '@google/genai';

// We will initialize the client inside the function so it explicitly grabs the API key after environment is loaded

/**
 * Generate a playlist from a natural language prompt, excluding songs the user already has.
 * 
 * @param {string} userPrompt - The natural language request (e.g., "chill jazz for studying")
 * @param {Array<string>} excludeList - Array of "Title by Artist" strings to avoid
 * @param {number} count - Number of songs to return (default 10)
 * @returns {Promise<Array<{title: string, artist: string, language: string}>>}
 */
export const curatPlaylistFromChat = async (userPrompt, excludeList = [], count = 10) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable is not set. Please configure it in .env');
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const systemInstruction = `You are a music curator bot. The user will ask for a playlist based on a description, mood, genre, or specific criteria.
Your job is to generate a list of exactly ${count} tracks that perfectly match the user's request.

CRITICAL RULES:
1. Return ONLY valid JSON in the requested format. Do not include markdown code blocks like \`\`\`json or \`\`\`. Just the raw JSON object.
2. Structure the JSON exactly like this:
{
  "genre": "The main genre of the playlist (e.g. Rock, Bollywood, Lofi)",
  "songs": [{"title": "Song Title", "artist": "Artist Name", "language": "Language"}]
}
3. DO NOT include any of the following songs, as the user already has them:
${excludeList.length > 0 ? excludeList.map(s => `- ${s}`).join('\n') : "No exclusions."}
4. Ensure variety and high relevance to the prompt.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userPrompt,
      config: {
        systemInstruction,
        // Force the model to output JSON if it supports it via schema, but flash is good at following instruction
        responseMimeType: "application/json", 
      }
    });

    const responseText = response.text;
    
    // Safety check in case the model wrapps it in markdown despite instructions
    const cleanText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const parsedResponse = JSON.parse(cleanText);
    
    if (!parsedResponse.genre || !Array.isArray(parsedResponse.songs)) {
      throw new Error("Gemini did not return the expected JSON structure");
    }

    return parsedResponse;
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw new Error('Failed to generate playlist from Gemini: ' + error.message);
  }
};
