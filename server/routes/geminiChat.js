import express from 'express';
import Playlist from '../models/Playlist.js';
import { authenticate } from '../middleware/authenticate.js';
import { normalizeString, escapeRegExp } from '../utils/validation.js';
import { curatPlaylistFromChat } from '../services/gemini.js';
import { VENUES } from '../services/venuePrompts.js';
const router = express.Router();

router.use(authenticate);

/** Build the "Title by Artist" exclusion list from all of a user's songs. */
async function buildExcludeList(userId) {
  const playlists = await Playlist.find({ userId });
  const exclude = [];
  playlists.forEach((p) => p.songs.forEach((s) => exclude.push(`${s.title} by ${s.artist}`)));
  return exclude;
}

/**
 * Shape AI songs into our song schema WITHOUT resolving YouTube ids.
 * Resolution happens lazily on first play (GET /api/youtube/resolve), so
 * generating a playlist costs zero YouTube quota.
 */
function resolveSongs(aiSongs, genre) {
  const ts = Date.now();
  return aiSongs.map((song, index) => ({
    id: `ai-${ts}-${index}`,
    title: song.title,
    artist: song.artist,
    genre,
    language: song.language || 'English',
    isCustom: false,
    duration: 0,
    youtubeId: '',
  }));
}

/** The user's strongest genres, blended with any recent-play genres. */
async function topGenres(userId, extra = [], limit = 2) {
  const playlists = await Playlist.find({ userId });
  const counts = {};
  playlists.forEach((p) => {
    counts[p.genre] = (counts[p.genre] || 0) + 1 + p.songs.length * 0.1;
  });
  extra.forEach((g) => {
    if (g) counts[g] = (counts[g] || 0) + 0.75;
  });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([g]) => g);
  const result = sorted.slice(0, limit);
  const fallbacks = ['Pop', 'Rock', 'Lo-Fi', 'Jazz', 'Hip Hop'];
  for (const f of fallbacks) {
    if (result.length >= limit) break;
    if (!result.includes(f)) result.push(f);
  }
  return result.slice(0, limit);
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

/**
 * POST /api/gemini/foryou
 * Body: { recentGenres?: string[] }
 * Personalized playlist suggestions (NOT persisted) based on the user's
 * taste, excluding songs they already own.
 */
router.post('/foryou', async (req, res) => {
  const recentGenres = Array.isArray(req.body?.recentGenres)
    ? req.body.recentGenres.filter((g) => typeof g === 'string').slice(0, 6)
    : [];

  try {
    const excludeList = await buildExcludeList(req.userId);
    const genres = await topGenres(req.userId, recentGenres, 2);
    const taste = genres.join(', ');

    const playlists = [];
    for (let i = 0; i < genres.length; i++) {
      const g = genres[i];
      const prompt = `Recommend a fresh ${g} playlist for a listener who enjoys ${taste}. Choose high-quality songs they likely don't already have. Keep it cohesive.`;
      const ai = await curatPlaylistFromChat(prompt, excludeList, 8);
      const genre = normalizeString(ai.genre) || g;
      const songs = await resolveSongs(ai.songs, genre);
      playlists.push({ id: `foryou-${i}-${Date.now()}`, name: `${genre} picks for you`, genre, songs });
      // Prevent the next suggestion from repeating these
      songs.forEach((s) => excludeList.push(`${s.title} by ${s.artist}`));
    }

    res.json({ playlists });
  } catch (error) {
    console.error('For You error:', error);
    res.status(500).json({ error: error.message || 'Failed to build recommendations' });
  }
});

export default router;
