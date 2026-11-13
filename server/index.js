import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import express from 'express';

import app from './app.js';
import Playlist from './models/Playlist.js';
import { connectDb, MONGODB_URI } from './db.js';

// Long-lived server entry (local dev, Render, Railway, Fly...).
// On Vercel, api/index.js imports ./app.js directly instead.
const PORT = process.env.PORT || 5000;

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

connectDb()
  .then(async () => {
    console.log('✅ Connected to MongoDB at', MONGODB_URI);
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
    console.error('Is MongoDB running? Start it with `mongod`, or set MONGODB_URI.');
    process.exit(1);
  });
