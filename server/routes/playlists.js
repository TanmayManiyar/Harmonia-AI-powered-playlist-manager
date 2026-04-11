import express from 'express';
import jwt from 'jsonwebtoken';
import Playlist from '../models/Playlist.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('JWT_SECRET environment variable is required');

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

// GET /api/playlists
router.get('/', async (req, res) => {
  try {
    const playlists = await Playlist.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(playlists);
  } catch (error) {
    console.error('Get playlists error:', error);
    res.status(500).json({ error: 'Failed to fetch playlists' });
  }
});

// POST /api/playlists
router.post('/', async (req, res) => {
  try {
    const { name, genre, songs } = req.body;

    if (!genre) {
      return res.status(400).json({ error: 'Genre is required' });
    }

    // Auto-number: count existing playlists of this genre for this user
    let playlistName = name;
    if (!playlistName) {
      const existingCount = await Playlist.countDocuments({
        userId: req.userId,
        genre: { $regex: new RegExp(`^${genre}$`, 'i') },
      });
      const number = existingCount + 1;
      playlistName = `${genre} Playlist ${number}`;
    }

    const playlist = await Playlist.create({
      userId: req.userId,
      name: playlistName,
      genre,
      songs: songs || [],
    });

    res.status(201).json(playlist);
  } catch (error) {
    console.error('Create playlist error:', error);
    res.status(500).json({ error: 'Failed to create playlist' });
  }
});

// PUT /api/playlists/:id
router.put('/:id', async (req, res) => {
  try {
    const playlist = await Playlist.findOne({ _id: req.params.id, userId: req.userId });
    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    const { name, isFavorite, songs } = req.body;
    if (name !== undefined) playlist.name = name;
    if (isFavorite !== undefined) playlist.isFavorite = isFavorite;
    if (songs !== undefined) playlist.songs = songs;

    await playlist.save();
    res.json(playlist);
  } catch (error) {
    console.error('Update playlist error:', error);
    res.status(500).json({ error: 'Failed to update playlist' });
  }
});

// POST /api/playlists/:id/songs
router.post('/:id/songs', async (req, res) => {
  try {
    const playlist = await Playlist.findOne({ _id: req.params.id, userId: req.userId });
    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    const song = req.body;
    if (!song.title || !song.artist) {
      return res.status(400).json({ error: 'Song title and artist are required' });
    }

    const exists = playlist.songs.some((s) => s.id === song.id);
    if (exists) {
      return res.status(400).json({ error: 'Song already in playlist' });
    }

    playlist.songs.push(song);
    await playlist.save();
    res.json(playlist);
  } catch (error) {
    console.error('Add song error:', error);
    res.status(500).json({ error: 'Failed to add song' });
  }
});

// DELETE /api/playlists/:id/songs/:songId
router.delete('/:id/songs/:songId', async (req, res) => {
  try {
    const playlist = await Playlist.findOne({ _id: req.params.id, userId: req.userId });
    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    playlist.songs = playlist.songs.filter((s) => s.id !== req.params.songId);
    await playlist.save();
    res.json(playlist);
  } catch (error) {
    console.error('Remove song error:', error);
    res.status(500).json({ error: 'Failed to remove song' });
  }
});

// DELETE /api/playlists/:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await Playlist.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!result) {
      return res.status(404).json({ error: 'Playlist not found' });
    }
    res.json({ message: 'Playlist deleted' });
  } catch (error) {
    console.error('Delete playlist error:', error);
    res.status(500).json({ error: 'Failed to delete playlist' });
  }
});

export default router;
