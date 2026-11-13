import 'dotenv/config.js';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

import authRoutes from './routes/auth.js';
import playlistRoutes from './routes/playlists.js';
import youtubeRoutes from './routes/youtube.js';
import youtubeSyncRoutes from './routes/youtubeSync.js';
import geminiChatRoutes from './routes/geminiChat.js';
import { authLimiter, aiLimiter, searchLimiter, apiLimiter } from './middleware/rateLimit.js';
import { connectDb } from './db.js';

// The Express app, with no side effects (no listen, no eager DB connect) so it
// can run both as a long-lived server (server/index.js) and as a Vercel
// serverless function (api/index.js).
const app = express();
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Trust the first proxy hop (Vercel/Render/etc.) so rate-limit sees real IPs
app.set('trust proxy', 1);

app.use(cors({ origin: [CLIENT_URL, 'http://localhost:5174', 'http://localhost:4173'], credentials: true }));
app.use(express.json());

// Health check (no DB needed to answer)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

// Lazily connect to MongoDB (cached across warm invocations)
app.use('/api', async (req, res, next) => {
  try {
    await connectDb();
    next();
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    res.status(503).json({ error: 'Database unavailable. Please try again shortly.' });
  }
});

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

export default app;
