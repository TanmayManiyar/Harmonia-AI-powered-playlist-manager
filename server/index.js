import 'dotenv/config.js';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

import Playlist from './models/Playlist.js';
import authRoutes from './routes/auth.js';
import playlistRoutes from './routes/playlists.js';
import youtubeRoutes from './routes/youtube.js';
import youtubeSyncRoutes from './routes/youtubeSync.js';
import geminiChatRoutes from './routes/geminiChat.js';
import { authLimiter, aiLimiter, searchLimiter, apiLimiter } from './middleware/rateLimit.js';

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/playlist-manager';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Trust the first proxy hop (Render/Railway/Fly/etc.) so rate-limit sees real IPs
app.set('trust proxy', 1);

// Middleware
app.use(cors({ origin: [CLIENT_URL, 'http://localhost:5174', 'http://localhost:4173'], credentials: true }));
app.use(express.json());
app.use('/api', apiLimiter);

// Routes (with quota/abuse-aware rate limits)
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/playlists', playlistRoutes);
app.use('/api/youtube', searchLimiter, youtubeRoutes);
app.use('/api/youtube-sync', youtubeSyncRoutes);
app.use('/api/gemini', aiLimiter, geminiChatRoutes);

// Redirect Google OAuth callback to youtube-sync handler
// (Google Cloud Console has the redirect URI set to /api/youtube/oauth/callback)
app.get('/api/youtube/oauth/callback', (req, res) => {
  const params = new URLSearchParams(req.query);
  res.redirect(`/api/youtube-sync/oauth/callback?${params.toString()}`);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

// Serve the built frontend on the same host (single-host deploy).
// Skipped in dev where Vite serves the frontend separately.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(path.join(distPath, 'index.html'))) {
  app.use(express.static(distPath));
  // SPA fallback: any non-API GET returns index.html (Express 5 safe)
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
  console.log('🗂️  Serving built frontend from /dist');
}

// Connect to MongoDB and start server
mongoose
  .connect(MONGODB_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB at', MONGODB_URI);
    console.log('📊 Open MongoDB Compass → connect to: ' + MONGODB_URI);
    console.log('   Database: playlist-manager | Collections: users, playlists');
    // Replace the legacy unique-sparse shareId index (which collided on null)
    // with the new partial index defined on the schema.
    try {
      await Playlist.syncIndexes();
    } catch (err) {
      console.error('⚠️  Index sync warning:', err.message);
    }
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    console.error('');
    console.error('MongoDB is not running. Please start it:');
    console.error('  1. Open a new terminal');
    console.error('  2. Run: mongod');
    console.error('');
    console.error('If MongoDB is not installed, download it from:');
    console.error('  https://www.mongodb.com/try/download/community');
    process.exit(1);
  });
