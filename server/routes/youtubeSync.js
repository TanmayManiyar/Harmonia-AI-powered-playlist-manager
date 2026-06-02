import express from 'express';
import jwt from 'jsonwebtoken';
import { google } from 'googleapis';
import User from '../models/User.js';
import Playlist from '../models/Playlist.js';
import { authenticate } from '../middleware/authenticate.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('JWT_SECRET environment variable is required');
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/youtube/oauth/callback'
  );
}

/**
 * GET /api/youtube-sync/oauth/start
 * Redirects user to Google's OAuth consent page
 * The app's JWT token is passed via 'state' parameter
 */
router.get('/oauth/start', (req, res) => {
  const appToken = req.query.token;
  if (!appToken) {
    return res.status(400).json({ error: 'App token required' });
  }

  const oauth2Client = getOAuth2Client();
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/youtube'],
    state: appToken, // pass our JWT so we know which user on callback
  });

  res.redirect(authUrl);
});

/**
 * GET /api/youtube-sync/oauth/callback
 * Google redirects here after user authorizes
 * Exchanges code for tokens and stores in user's DB record
 */
router.get('/oauth/callback', async (req, res) => {
  const { code, state: appToken } = req.query;

  if (!code || !appToken) {
    return res.status(400).send('Missing authorization code or state');
  }

  try {
    // Verify our app JWT to get user ID
    const decoded = jwt.verify(appToken, JWT_SECRET);
    const userId = decoded.id;

    // Exchange code for tokens
    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);

    // Store tokens in user record
    await User.findByIdAndUpdate(userId, {
      googleTokens: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        scope: tokens.scope,
        token_type: tokens.token_type,
        expiry_date: tokens.expiry_date,
      },
    });

    // Redirect back to the app with success message
    res.redirect(`${CLIENT_URL}/?youtube_connected=true`);
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.redirect(`${CLIENT_URL}/?youtube_error=true`);
  }
});

/**
 * GET /api/youtube-sync/status
 * Check if user has connected their Google/YouTube account
 */
router.get('/status', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const connected = !!(user?.googleTokens?.access_token);
    res.json({ connected });
  } catch (error) {
    res.json({ connected: false });
  }
});

/**
 * DELETE /api/youtube-sync/disconnect
 * Remove stored Google tokens
 */
router.delete('/disconnect', authenticate, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.userId, { googleTokens: null });
    res.json({ message: 'Disconnected from YouTube' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to disconnect' });
  }
});

/**
 * POST /api/youtube-sync/sync/:playlistId
 * Creates a YouTube playlist and adds all songs to it
 */
router.post('/sync/:playlistId', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user?.googleTokens?.access_token) {
      return res.status(400).json({ error: 'YouTube account not connected. Please connect first.' });
    }

    const playlist = await Playlist.findOne({ _id: req.params.playlistId, userId: req.userId });
    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    // Set up OAuth2 client with stored tokens
    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials(user.googleTokens);

    // Handle token refresh
    oauth2Client.on('tokens', async (newTokens) => {
      const update = {};
      if (newTokens.access_token) update['googleTokens.access_token'] = newTokens.access_token;
      if (newTokens.expiry_date) update['googleTokens.expiry_date'] = newTokens.expiry_date;
      if (newTokens.refresh_token) update['googleTokens.refresh_token'] = newTokens.refresh_token;
      await User.findByIdAndUpdate(req.userId, update);
    });

    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

    // Step 1: Create the YouTube playlist
    const createRes = await youtube.playlists.insert({
      part: 'snippet,status',
      requestBody: {
        snippet: {
          title: playlist.name,
          description: `Created by Harmonia — Genre: ${playlist.genre}`,
        },
        status: {
          privacyStatus: 'private', // private by default
        },
      },
    });

    const ytPlaylistId = createRes.data.id;
    let addedCount = 0;
    let skippedCount = 0;

    // Step 2: Add each song that has a YouTube video ID
    for (const song of playlist.songs) {
      if (!song.youtubeId) {
        // Try searching for the song on YouTube
        try {
          const searchRes = await youtube.search.list({
            part: 'snippet',
            q: `${song.title} ${song.artist}`,
            type: 'video',
            videoCategoryId: '10',
            maxResults: 1,
          });

          if (searchRes.data.items && searchRes.data.items.length > 0) {
            const videoId = searchRes.data.items[0].id.videoId;
            await youtube.playlistItems.insert({
              part: 'snippet',
              requestBody: {
                snippet: {
                  playlistId: ytPlaylistId,
                  resourceId: {
                    kind: 'youtube#video',
                    videoId,
                  },
                },
              },
            });
            addedCount++;
          } else {
            skippedCount++;
          }
        } catch (err) {
          console.error(`Failed to search/add song "${song.title}":`, err.message);
          skippedCount++;
        }
      } else {
        // Has a YouTube video ID — add directly
        try {
          await youtube.playlistItems.insert({
            part: 'snippet',
            requestBody: {
              snippet: {
                playlistId: ytPlaylistId,
                resourceId: {
                  kind: 'youtube#video',
                  videoId: song.youtubeId,
                },
              },
            },
          });
          addedCount++;
        } catch (err) {
          console.error(`Failed to add song "${song.title}":`, err.message);
          skippedCount++;
        }
      }

      // Small delay to respect rate limits
      await new Promise((r) => setTimeout(r, 200));
    }

    res.json({
      success: true,
      youtubePlaylistId: ytPlaylistId,
      youtubePlaylistUrl: `https://www.youtube.com/playlist?list=${ytPlaylistId}`,
      addedCount,
      skippedCount,
      totalSongs: playlist.songs.length,
    });
  } catch (error) {
    console.error('YouTube sync error:', error.message);

    // Handle token expiry
    if (error.message?.includes('invalid_grant') || error.code === 401) {
      await User.findByIdAndUpdate(req.userId, { googleTokens: null });
      return res.status(401).json({ error: 'YouTube authorization expired. Please reconnect.' });
    }

    res.status(500).json({ error: 'Failed to sync playlist to YouTube: ' + error.message });
  }
});

export default router;
