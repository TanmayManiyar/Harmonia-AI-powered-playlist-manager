import express from 'express';
import axios from 'axios';
import Playlist from '../models/Playlist.js';
import { authenticate } from '../middleware/authenticate.js';
import { normalizeString, escapeRegExp } from '../utils/validation.js';
import { curatPlaylistFromChat } from '../services/gemini.js';
import { VENUES } from '../services/venuePrompts.js';

const router = express.Router();
const YOUTUBE_BASE_URL = 'https://www.googleapis.com/youtube/v3';

router.use(authenticate);

function getApiKey() {
  return process.env.YOUTUBE_API_KEY || process.env.VITE_YOUTUBE_API_KEY || '';
}

/** Build the "Title by Artist" exclusion list from all of a user's songs. */
async function buildExcludeList(userId) {
  const playlists = await Playlist.find({ userId });
  const exclude = [];
  playlists.forEach((p) => p.songs.forEach((s) => exclude.push(`${s.title} by ${s.artist}`)));
  return exclude;
}

/** Resolve each AI song to a YouTube video id (best-effort) and shape it. */
async function resolveSongs(aiSongs, genre) {
  const ytApiKey = getApiKey();
  const finalSongs = [];
  for (const [index, song] of aiSongs.entries()) {
    let youtubeId = '';
    if (ytApiKey) {
      try {
        const ytResponse = await axios.get(`${YOUTUBE_BASE_URL}/search`, {
          params: {
            part: 'snippet',
            q: `${song.title} ${song.artist} audio`,
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
      }
    }
    finalSongs.push({
      id: `ai-${Date.now()}-${index}`,
      title: song.title,
      artist: song.artist,
      genre,
      language: song.language || 'English',
      isCustom: false,
      duration: 0,
      youtubeId,
    });
  }
  return finalSongs;
}

/** Next auto-numbered name for a genre, e.g. "Jazz Playlist 3". */
async function nextName(userId, genre, suffix) {
  const genreCount = await Playlist.countDocuments({
    userId,
    genre: { $regex: new RegExp(`^${escapeRegExp(genre)}$`, 'i') },
  });
  return `${genre} ${suffix} ${genreCount + 1}`;
}

/**
 * POST /api/gemini/chat
 * Body: { prompt, playlistName?, genre? }
 */
router.post('/chat', async (req, res) => {
  const { prompt, playlistName, genre } = req.body;
  const userPrompt = normalizeString(prompt);

  if (!userPrompt) return res.status(400).json({ error: 'Prompt is required' });
  if (playlistName !== undefined && !normalizeString(playlistName))
    return res.status(400).json({ error: 'Playlist name must not be empty' });
  if (genre !== undefined && !normalizeString(genre))
    return res.status(400).json({ error: 'Genre must not be empty' });

  try {
    const excludeList = await buildExcludeList(req.userId);

    let requestedCount = 10;
    const match = userPrompt.match(/\b(\d+)\s*(songs?|tracks?)\b/i);
    if (match && match[1]) {
      requestedCount = parseInt(match[1], 10);
      if (requestedCount > 30) requestedCount = 30;
      if (requestedCount < 1) requestedCount = 10;
    }

    const aiResponse = await curatPlaylistFromChat(userPrompt, excludeList, requestedCount);
    const assignedGenre = normalizeString(genre) || normalizeString(aiResponse.genre) || 'AI Mix';
    const assignedName = normalizeString(playlistName) || (await nextName(req.userId, assignedGenre, 'Playlist')) + ' AI';

    const finalSongs = await resolveSongs(aiResponse.songs, assignedGenre);
    const newPlaylist = await Playlist.create({
      userId: req.userId,
      name: assignedName,
      genre: assignedGenre,
      songs: finalSongs,
    });
    res.status(201).json(newPlaylist);
  } catch (error) {
    console.error('AI Chat Error:', error);
    res.status(500).json({ error: error.message || 'Failed to process AI chat request' });
  }
});

/**
 * POST /api/gemini/venue
 * Body: { venue: "<venue-id>", count? }
 * One-tap, vibe-matched playlist for a venue type.
 */
router.post('/venue', async (req, res) => {
  const venueId = normalizeString(req.body?.venue).toLowerCase();
  const venue = VENUES[venueId];
  if (!venue) return res.status(400).json({ error: 'Unknown venue' });

  let count = parseInt(req.body?.count, 10);
  if (!Number.isFinite(count) || count < 1) count = 12;
  if (count > 30) count = 30;

  try {
    const excludeList = await buildExcludeList(req.userId);
    const aiResponse = await curatPlaylistFromChat(venue.prompt, excludeList, count);
    const assignedGenre = venue.label;
    const assignedName = await nextName(req.userId, assignedGenre, 'Mix');

    const finalSongs = await resolveSongs(aiResponse.songs, assignedGenre);
    const newPlaylist = await Playlist.create({
      userId: req.userId,
      name: assignedName,
      genre: assignedGenre,
      songs: finalSongs,
    });
    res.status(201).json(newPlaylist);
  } catch (error) {
    console.error('Venue playlist error:', error);
    res.status(500).json({ error: error.message || 'Failed to create venue playlist' });
  }
});

export default router;
