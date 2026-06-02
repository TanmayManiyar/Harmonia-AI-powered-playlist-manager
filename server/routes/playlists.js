import express from 'express';
import Playlist from '../models/Playlist.js';
import { authenticate } from '../middleware/authenticate.js';
import { isNonEmptyString, normalizeString, parseSongList, isSongInput, normalizeSong, escapeRegExp } from '../utils/validation.js';

const router = express.Router();

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
    const playlistGenre = normalizeString(genre);

    if (!playlistGenre) {
      return res.status(400).json({ error: 'Genre is required' });
    }

    if (name !== undefined && !isNonEmptyString(name)) {
      return res.status(400).json({ error: 'Playlist name must not be empty' });
    }

    const parsedSongs = parseSongList(songs, playlistGenre);
    if (parsedSongs === null) {
      return res.status(400).json({ error: 'Songs must be an array of valid song objects' });
    }

    // Auto-number: count existing playlists of this genre for this user
    let playlistName = normalizeString(name);
    if (!playlistName) {
      const existingCount = await Playlist.countDocuments({
        userId: req.userId,
        genre: { $regex: new RegExp(`^${escapeRegExp(playlistGenre)}$`, 'i') },
      });
      const number = existingCount + 1;
      playlistName = `${playlistGenre} Playlist ${number}`;
    }

    const playlist = await Playlist.create({
      userId: req.userId,
      name: playlistName,
      genre: playlistGenre,
      songs: parsedSongs,
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
    if (name !== undefined) {
      if (!isNonEmptyString(name)) {
        return res.status(400).json({ error: 'Playlist name must not be empty' });
      }
      playlist.name = normalizeString(name);
    }
    if (isFavorite !== undefined) {
      if (typeof isFavorite !== 'boolean') {
        return res.status(400).json({ error: 'isFavorite must be a boolean' });
      }
      playlist.isFavorite = isFavorite;
    }
    if (songs !== undefined) {
      const parsedSongs = parseSongList(songs, playlist.genre);
      if (parsedSongs === null) {
        return res.status(400).json({ error: 'Songs must be an array of valid song objects' });
      }
      playlist.songs = parsedSongs;
    }

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
    if (!isSongInput(song)) {
      return res.status(400).json({ error: 'Song title and artist are required' });
    }
    const normalizedSong = normalizeSong(song, playlist.genre);

    const exists = playlist.songs.some((s) => s.id === normalizedSong.id);
    if (exists) {
      return res.status(400).json({ error: 'Song already in playlist' });
    }

    playlist.songs.push(normalizedSong);
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
