import express from 'express';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import Playlist from '../models/Playlist.js';
import { curatPlaylistFromChat } from '../services/gemini.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('JWT_SECRET environment variable is required');
const YOUTUBE_BASE_URL = 'https://www.googleapis.com/youtube/v3';

// Auth middleware
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

router.use(authenticate);

function getApiKey() {
  return process.env.YOUTUBE_API_KEY || process.env.VITE_YOUTUBE_API_KEY || '';
}

/**
 * POST /api/gemini/chat
 * Generates a playlist based on a user's natural language prompt.
 * Expected body: { prompt: "string", playlistName: "string", genre: "string" }
 */
router.post('/chat', async (req, res) => {
  const { prompt, playlistName, genre } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    // 1. Get all existing songs for this user across all their playlists to prevent duplicates
    const allUserPlaylists = await Playlist.find({ userId: req.userId });
    const excludeList = [];
    allUserPlaylists.forEach(playlist => {
      playlist.songs.forEach(song => {
        excludeList.push(`${song.title} by ${song.artist}`);
      });
    });

    // 2. Parse optional song count from prompt (e.g. "20 songs")
    let requestedCount = 10;
    const match = prompt.match(/\b(\d+)\s*(songs?|tracks?)\b/i);
    if (match && match[1]) {
      requestedCount = parseInt(match[1], 10);
      if (requestedCount > 30) requestedCount = 30; // Cap at 30 to save YT quota
      if (requestedCount < 1) requestedCount = 10;
    }

    // 3. Call Gemini
    const aiResponse = await curatPlaylistFromChat(prompt, excludeList, requestedCount);
    const assignedGenre = genre || aiResponse.genre || 'AI Mix';
    
    // Calculate name: Genre Playlist N AI
    const existingCount = await Playlist.countDocuments({
      userId: req.userId,
      name: { $regex: new RegExp(`\\bAI\\b`, 'i') }, // Count AI playlists for numbering, or use genre
    });
    
    // Better numbering: base it precisely on the genre
    const genreCount = await Playlist.countDocuments({
      userId: req.userId,
      genre: { $regex: new RegExp(`^${assignedGenre}$`, 'i') }
    });
    
    const assignedName = playlistName || `${assignedGenre} Playlist ${genreCount + 1} AI`;

    const aiSongs = aiResponse.songs;

    // 3. For each song, find the YouTube video ID
    const ytApiKey = getApiKey();
    const finalSongs = [];
    
    for (const [index, song] of aiSongs.entries()) {
      let youtubeId = '';
      
      if (ytApiKey) {
        try {
          const searchQuery = `${song.title} ${song.artist} audio`;
          const ytResponse = await axios.get(`${YOUTUBE_BASE_URL}/search`, {
            params: {
              part: 'snippet',
              q: searchQuery,
              type: 'video',
              videoCategoryId: '10',
              maxResults: 1,
              key: ytApiKey,
            },
          });
          
          if (ytResponse.data.items && ytResponse.data.items.length > 0) {
            youtubeId = ytResponse.data.items[0].id.videoId;
          }
        } catch (ytError) {
          console.error(`Failed to fetch YouTube ID for ${song.title}:`, ytError.response?.data || ytError.message);
          // Continue without a video ID if YouTube fails
        }
      }

      finalSongs.push({
        id: `ai-${Date.now()}-${index}`,
        title: song.title,
        artist: song.artist,
        genre: assignedGenre,
        language: song.language || 'English',
        isCustom: false,
        duration: 0,
        youtubeId: youtubeId,
      });
    }

    // 4. Create the new playlist
    const newPlaylist = await Playlist.create({
      userId: req.userId,
      name: assignedName,
      genre: assignedGenre,
      songs: finalSongs
    });

    res.status(201).json(newPlaylist);

  } catch (error) {
    console.error('AI Chat Error:', error);
    res.status(500).json({ error: error.message || 'Failed to process AI chat request' });
  }
});

export default router;
