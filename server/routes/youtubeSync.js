import express from 'express';
import crypto from 'crypto';
import { google } from 'googleapis';
import User from '../models/User.js';
import Playlist from '../models/Playlist.js';
import { authenticate } from '../middleware/authenticate.js';

const router = express.Router();
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Single-use OAuth state nonces. Bound to a userId, expire after 10 minutes.
// In-memory is fine for single-instance deployments; switch to Mongo if scaling out.
const NONCE_TTL_MS = 10 * 60 * 1000;
const oauthNonces = new Map();

function createOAuthNonce(userId) {
  const now = Date.now();
  for (const [n, data] of oauthNonces) {
    if (data.expiresAt < now) oauthNonces.delete(n);
  }
  const nonce = crypto.randomBytes(32).toString('base64url');
  oauthNonces.set(nonce, { userId, expiresAt: now + NONCE_TTL_MS });
  return nonce;
}

function consumeOAuthNonce(nonce) {
  const data = oauthNonces.get(nonce);
  if (!data) return null;
  oauthNonces.delete(nonce);
  if (data.expiresAt < Date.now()) return null;
  return data.userId;
}

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/youtube/oauth/callback'
  );
}

/**
 * GET /api/youtube-sync/oauth/start
 * Authenticated. Issues a single-use nonce bound to the user and returns the
 * Google consent URL with that nonce as `state`. Frontend redirects to it.
 */
router.get('/oauth/start', authenticate, (req, res) => {
  const nonce = createOAuthNonce(req.userId);
  const oauth2Client = getOAuth2Client();
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/youtube'],
    state: nonce,
  });
  res.json({ url: authUrl });
});

/**
 * GET /api/youtube-sync/oauth/callback
 * Google redirects here after user authorizes. Verifies the state nonce,
 * exchanges the code for tokens, and stores them on the user record.
 */
router.get('/oauth/callback', async (req, res) => {
  const { code, state } = req.query;

  if (!code || !state) {
    return res.status(400).send('Missing authorization code or state');
  }

  const userId = consumeOAuthNonce(state);
  if (!userId) {
    return res.redirect(`${CLIENT_URL}/?youtube_error=invalid_state`);
  }

  try {
    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);

    await User.findByIdAndUpdate(userId, {
      googleTokens: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        scope: tokens.scope,
        token_type: tokens.token_type,
        expiry_date: tokens.expiry_date,
      },
    });

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
