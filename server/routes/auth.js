import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Playlist from '../models/Playlist.js';
import { authenticate } from '../middleware/authenticate.js';
import { isNonEmptyString, normalizeString } from '../utils/validation.js';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('JWT_SECRET environment variable is required');
const JWT_EXPIRES_IN = '7d';

const signToken = (userId) => jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const normalizedEmail = normalizeString(email).toLowerCase();

    if (!normalizedEmail || !isNonEmptyString(password)) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    if (name !== undefined && !isNonEmptyString(name)) {
      return res.status(400).json({ error: 'Name must not be empty' });
    }

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    const userName = normalizeString(name) || normalizedEmail.split('@')[0]
      .replace(/[._-]/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());

    // Hash password before storing
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: userName,
      email: normalizedEmail,
      password: hashedPassword,
    });

    const token = signToken(user._id);
    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = normalizeString(email).toLowerCase();

    if (!normalizedEmail || !isNonEmptyString(password)) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = signToken(user._id);
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    res.json({ user: { id: user._id, name: user.name, email: user.email } });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// DELETE /api/auth/account — permanently delete user account and all data
router.delete('/account', authenticate, async (req, res) => {
  try {
    const userId = req.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete all playlists belonging to this user
    const deletedPlaylists = await Playlist.deleteMany({ userId: userId.toString() });

    // Delete the user account
    await User.findByIdAndDelete(userId);

    res.json({
      message: 'Account and all data deleted successfully',
      deletedPlaylists: deletedPlaylists.deletedCount,
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

export default router;
