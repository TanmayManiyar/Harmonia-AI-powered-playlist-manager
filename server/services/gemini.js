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
4. EVERY song MUST be unique. NEVER repeat the same song, and never list the same title twice. Use a diverse mix of different artists — do not put the same artist on more than 2 tracks.
5. Ensure variety and high relevance to the prompt.`;

  try {
    const response = await ai.models.generateContent({
      // 2.5-flash-lite has a more generous free-tier daily limit than 2.5-flash.
      // Override with GEMINI_MODEL in .env if you have billing / a paid plan.
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite',
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        temperature: 1.1, // more variety, less repetition
      }
    });

    const responseText = response.text;

    // Safety check in case the model wraps it in markdown despite instructions
    const cleanText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const parsedResponse = JSON.parse(cleanText);

    if (!parsedResponse.genre || !Array.isArray(parsedResponse.songs)) {
      throw new Error("Gemini did not return the expected JSON structure");
    }

    // De-duplicate (guards against model repetition) and drop malformed entries
    const seen = new Set();
    const songs = parsedResponse.songs.filter((s) => {
      if (!s || !s.title || !s.artist) return false;
      const key = `${String(s.title).toLowerCase().trim()}|${String(s.artist).toLowerCase().trim()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return { genre: parsedResponse.genre, songs };
  } catch (error) {
    console.error('Gemini API Error:', error);
    const msg = String(error?.message || '');
    if (msg.includes('429') || /quota|RESOURCE_EXHAUSTED|rate.?limit/i.test(msg)) {
      throw new Error("Gemini is out of free quota for now — it resets daily. Try again later or add billing to your Google AI key.");
    }
    throw new Error('Failed to generate playlist from Gemini: ' + msg);
  }
};
