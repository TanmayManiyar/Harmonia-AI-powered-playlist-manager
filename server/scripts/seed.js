/**
 * Seed a few featured playlists so a fresh deploy isn't empty.
 *
 *   node server/scripts/seed.js     (or: npm run seed)
 *
 * Creates a "Harmonia" demo account that owns the featured playlists, so they
 * surface in every real user's "Trending rn" discover feed (which lists OTHER
 * users' popular playlists). Song video ids are resolved best-effort from the
 * YouTube API when YOUTUBE_API_KEY is set and within quota.
 */
import 'dotenv/config.js';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import axios from 'axios';
import User from '../models/User.js';
import Playlist from '../models/Playlist.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/playlist-manager';
const YT_KEY = process.env.YOUTUBE_API_KEY || process.env.VITE_YOUTUBE_API_KEY || '';
const DEMO_EMAIL = 'featured@harmonia.app';

const s = (title, artist) => ({ title, artist });

const FEATURED = [
  { name: 'Global Top Hits 🌍', genre: 'Pop', songs: [
    s('Blinding Lights', 'The Weeknd'), s('Flowers', 'Miley Cyrus'), s('As It Was', 'Harry Styles'),
    s('Anti-Hero', 'Taylor Swift'), s('Levitating', 'Dua Lipa'), s('Stay', 'The Kid LAROI & Justin Bieber'),
    s('good 4 u', 'Olivia Rodrigo'), s('Bad Guy', 'Billie Eilish'),
  ]},
  { name: 'Bollywood Heat 🔥', genre: 'Bollywood', songs: [
    s('Kesariya', 'Arijit Singh'), s('Tum Hi Ho', 'Arijit Singh'), s('Raataan Lambiyan', 'Jubin Nautiyal'),
    s('Apna Bana Le', 'Arijit Singh'), s('Channa Mereya', 'Arijit Singh'), s('Kal Ho Naa Ho', 'Sonu Nigam'),
    s('Kabira', 'Arijit Singh'), s('Jai Ho', 'A.R. Rahman'),
  ]},
  { name: 'Gym Bangers 💪', genre: 'Hype', songs: [
    s('Stronger', 'Kanye West'), s('Till I Collapse', 'Eminem'), s('HUMBLE.', 'Kendrick Lamar'),
    s('Lose Yourself', 'Eminem'), s('Sicko Mode', 'Travis Scott'), s('Believer', 'Imagine Dragons'),
    s("Can't Hold Us", 'Macklemore & Ryan Lewis'), s('Power', 'Kanye West'),
  ]},
  { name: '2010s Throwback 🕺', genre: 'Throwback', songs: [
    s('Uptown Funk', 'Mark Ronson ft. Bruno Mars'), s('Rolling in the Deep', 'Adele'), s('Shape of You', 'Ed Sheeran'),
    s('Counting Stars', 'OneRepublic'), s('Get Lucky', 'Daft Punk'), s('Royals', 'Lorde'),
    s('Radioactive', 'Imagine Dragons'), s('Wake Me Up', 'Avicii'),
  ]},
  { name: 'Chill Vibes 😌', genre: 'Chill', songs: [
    s('Sunflower', 'Post Malone'), s('Heat Waves', 'Glass Animals'), s('Riptide', 'Vance Joy'),
    s('Electric Feel', 'MGMT'), s('Banana Pancakes', 'Jack Johnson'), s('The Night We Met', 'Lord Huron'),
    s('Location', 'Khalid'), s('Sweater Weather', 'The Neighbourhood'),
  ]},
  { name: 'Jazz & Soul 🎷', genre: 'Jazz', songs: [
    s('Take Five', 'Dave Brubeck'), s('So What', 'Miles Davis'), s('Feeling Good', 'Nina Simone'),
    s('Fly Me to the Moon', 'Frank Sinatra'), s('What a Wonderful World', 'Louis Armstrong'),
    s('My Favorite Things', 'John Coltrane'), s('Autumn Leaves', 'Bill Evans'), s('Summertime', 'Ella Fitzgerald'),
  ]},
];

async function resolveYouTubeId(title, artist) {
  if (!YT_KEY) return '';
  try {
    const r = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: { part: 'snippet', q: `${title} ${artist} audio`, type: 'video', videoCategoryId: '10', maxResults: 1, key: YT_KEY },
    });
    return r.data.items?.[0]?.id?.videoId || '';
  } catch {
    return '';
  }
}

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to', MONGODB_URI);

  // Demo owner account (not meant for login)
  let owner = await User.findOne({ email: DEMO_EMAIL });
  if (!owner) {
    owner = await User.create({
      name: 'Harmonia',
      email: DEMO_EMAIL,
      password: await bcrypt.hash('seed-' + Math.random().toString(36).slice(2), 12),
    });
    console.log('Created demo owner:', owner.name);
  }

  // Idempotent: clear previous featured playlists, then recreate
  const removed = await Playlist.deleteMany({ userId: owner._id.toString() });
  console.log('Cleared', removed.deletedCount, 'old featured playlists');

  let resolved = 0;
  let total = 0;
  for (const f of FEATURED) {
    const songs = [];
    for (const song of f.songs) {
      total++;
      const youtubeId = await resolveYouTubeId(song.title, song.artist);
      if (youtubeId) resolved++;
      songs.push({
        id: `seed-${Math.random().toString(36).slice(2, 10)}`,
        title: song.title,
        artist: song.artist,
        genre: f.genre,
        language: 'English',
        duration: 0,
        isCustom: false,
        youtubeId,
      });
    }
    await Playlist.create({
      userId: owner._id.toString(),
      name: f.name,
      genre: f.genre,
      songs,
      playCount: 50 + Math.floor(Math.random() * 450), // trend in discover
    });
    console.log('Seeded:', f.name, `(${songs.length} songs)`);
  }

  console.log(`\nDone. Resolved ${resolved}/${total} YouTube ids` + (YT_KEY ? '' : ' (no YOUTUBE_API_KEY — songs unplayable until re-seeded with a key)') + '.');
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
