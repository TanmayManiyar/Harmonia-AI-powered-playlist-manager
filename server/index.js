import 'dotenv/config.js';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

import authRoutes from './routes/auth.js';
import playlistRoutes from './routes/playlists.js';
import youtubeRoutes from './routes/youtube.js';
import youtubeSyncRoutes from './routes/youtubeSync.js';
import geminiChatRoutes from './routes/geminiChat.js';

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/playlist-manager';

// Middleware
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:4173'], credentials: true }));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/playlists', playlistRoutes);
app.use('/api/youtube', youtubeRoutes);
app.use('/api/youtube-sync', youtubeSyncRoutes);
app.use('/api/gemini', geminiChatRoutes);

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

// Connect to MongoDB and start server
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB at', MONGODB_URI);
    console.log('📊 Open MongoDB Compass → connect to: ' + MONGODB_URI);
    console.log('   Database: playlist-manager | Collections: users, playlists');
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
