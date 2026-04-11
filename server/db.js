import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '..', 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const PLAYLISTS_FILE = path.join(DATA_DIR, 'playlists.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const readJSON = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err.message);
  }
  return [];
};

const writeJSON = (filePath, data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
};

// ---- Users ----
export const findUserByEmail = (email) => {
  return readJSON(USERS_FILE).find((u) => u.email === email.toLowerCase().trim());
};

export const findUserById = (id) => {
  return readJSON(USERS_FILE).find((u) => u.id === id);
};

export const createUser = (user) => {
  const users = readJSON(USERS_FILE);
  users.push(user);
  writeJSON(USERS_FILE, users);
  return user;
};

// ---- Playlists ----
export const getPlaylists = (userId) => {
  return readJSON(PLAYLISTS_FILE).filter((p) => p.userId === userId);
};

const getAllPlaylists = () => readJSON(PLAYLISTS_FILE);

export const findPlaylist = (id, userId) => {
  return readJSON(PLAYLISTS_FILE).find((p) => p._id === id && p.userId === userId);
};

export const createPlaylist = (playlist) => {
  const playlists = getAllPlaylists();
  playlists.push(playlist);
  writeJSON(PLAYLISTS_FILE, playlists);
  return playlist;
};

export const updatePlaylist = (id, userId, updates) => {
  const playlists = getAllPlaylists();
  const index = playlists.findIndex((p) => p._id === id && p.userId === userId);
  if (index === -1) return null;

  playlists[index] = { ...playlists[index], ...updates, updatedAt: new Date().toISOString() };
  writeJSON(PLAYLISTS_FILE, playlists);
  return playlists[index];
};

export const deletePlaylist = (id, userId) => {
  const playlists = getAllPlaylists();
  const index = playlists.findIndex((p) => p._id === id && p.userId === userId);
  if (index === -1) return false;

  playlists.splice(index, 1);
  writeJSON(PLAYLISTS_FILE, playlists);
  return true;
};
