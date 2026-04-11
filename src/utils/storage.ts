import { Playlist } from '../models';

/**
 * Storage keys for local storage
 */
const STORAGE_KEYS = {
  PLAYLISTS: 'playlist-manager:playlists',
  LANGUAGE_PREFERENCE: 'playlist-manager:language',
} as const;

/**
 * Serializable state structure for storage
 * (Currently unused - for future enhancement)
 */
// interface StorageState {
//   playlists: [string, Playlist][];
//   languagePreference: string;
//   serviceConnections: [StreamingServiceType, ServiceConnection][];
// }

/**
 * Save playlists to local storage
 */
export const savePlaylists = (playlists: Map<string, Playlist>): void => {
  try {
    const playlistArray = Array.from(playlists.entries());
    const serialized = JSON.stringify(playlistArray);
    localStorage.setItem(STORAGE_KEYS.PLAYLISTS, serialized);
  } catch (error) {
    console.error('Failed to save playlists to local storage:', error);
  }
};

/**
 * Load playlists from local storage
 * Returns empty Map if data is corrupted or unavailable
 */
export const loadPlaylists = (): Map<string, Playlist> => {
  try {
    const serialized = localStorage.getItem(STORAGE_KEYS.PLAYLISTS);
    if (!serialized) {
      return new Map();
    }

    const playlistArray = JSON.parse(serialized) as [string, Playlist][];
    
    // Validate structure
    if (!Array.isArray(playlistArray)) {
      console.warn('Corrupted playlist data: not an array');
      return new Map();
    }

    // Convert date strings back to Date objects
    const playlists = new Map<string, Playlist>();
    for (const [id, playlist] of playlistArray) {
      if (!playlist || typeof playlist !== 'object') {
        console.warn('Skipping invalid playlist entry');
        continue;
      }

      playlists.set(id, {
        ...playlist,
        createdAt: new Date(playlist.createdAt),
        updatedAt: new Date(playlist.updatedAt),
      });
    }

    return playlists;
  } catch (error) {
    console.error('Failed to load playlists from local storage:', error);
    return new Map();
  }
};

/**
 * Save language preference to local storage
 */
export const saveLanguagePreference = (language: string): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.LANGUAGE_PREFERENCE, language);
  } catch (error) {
    console.error('Failed to save language preference:', error);
  }
};

/**
 * Load language preference from local storage
 * Returns 'en' as default if unavailable
 */
export const loadLanguagePreference = (): string => {
  try {
    const language = localStorage.getItem(STORAGE_KEYS.LANGUAGE_PREFERENCE);
    return language || 'en';
  } catch (error) {
    console.error('Failed to load language preference:', error);
    return 'en';
  }
};

/**
 * Clear all stored data (useful for testing or reset)
 */
export const clearStorage = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEYS.PLAYLISTS);
    localStorage.removeItem(STORAGE_KEYS.LANGUAGE_PREFERENCE);
  } catch (error) {
    console.error('Failed to clear storage:', error);
  }
};
