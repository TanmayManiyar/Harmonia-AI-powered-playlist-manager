import { create } from 'zustand';
import { Playlist, Song } from '../models';
import { api } from '../services/api';

/**
 * Application state interface
 */
interface PlaylistState {
  // State
  playlists: Map<string, Playlist>;
  languagePreference: string;
  isLoading: boolean;

  // Actions
  fetchPlaylists: () => Promise<void>;
  createPlaylist: (genre: string) => Promise<Playlist>;
  deletePlaylist: (playlistId: string) => Promise<void>;
  addSongToPlaylist: (playlistId: string, song: Song) => Promise<void>;
  removeSongFromPlaylist: (playlistId: string, songId: string) => Promise<void>;
  toggleFavorite: (playlistId: string) => Promise<void>;
  updatePlaylistName: (playlistId: string, name: string) => Promise<void>;
  setLanguagePreference: (language: string) => void;

  // Selectors
  getAllPlaylists: () => Playlist[];
  getFavoritePlaylists: () => Playlist[];
  getPlaylistsByGenre: () => Map<string, Playlist[]>;
  getPlaylistByGenre: (genre: string) => Playlist | undefined;
}

/**
 * Convert API playlist data to our Playlist model
 */
const toPlaylist = (data: any): Playlist => ({
  id: data._id || data.id,
  name: data.name,
  genre: data.genre,
  songs: data.songs || [],
  isFavorite: data.isFavorite || false,
  createdAt: new Date(data.createdAt),
  updatedAt: new Date(data.updatedAt),
});

/**
 * Zustand store for playlist management
 * Calls backend API and keeps local state in sync
 */
export const usePlaylistStore = create<PlaylistState>((set, get) => ({
  playlists: new Map(),
  languagePreference: localStorage.getItem('playlist-manager:language') || 'en',
  isLoading: false,

  fetchPlaylists: async () => {
    try {
      set({ isLoading: true });
      const data = await api.getPlaylists();
      const playlistMap = new Map<string, Playlist>();
      data.forEach((p: any) => {
        const playlist = toPlaylist(p);
        playlistMap.set(playlist.id, playlist);
      });
      set({ playlists: playlistMap, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch playlists:', error);
      set({ isLoading: false });
    }
  },

  createPlaylist: async (genre: string) => {
    const data = await api.createPlaylist(genre);
    const playlist = toPlaylist(data);

    set((state) => {
      const newPlaylists = new Map(state.playlists);
      newPlaylists.set(playlist.id, playlist);
      return { playlists: newPlaylists };
    });

    return playlist;
  },

  deletePlaylist: async (playlistId: string) => {
    await api.deletePlaylist(playlistId);

    set((state) => {
      const newPlaylists = new Map(state.playlists);
      newPlaylists.delete(playlistId);
      return { playlists: newPlaylists };
    });
  },

  addSongToPlaylist: async (playlistId: string, song: Song) => {
    try {
      const data = await api.addSongToPlaylist(playlistId, song);
      const playlist = toPlaylist(data);

      set((state) => {
        const newPlaylists = new Map(state.playlists);
        newPlaylists.set(playlist.id, playlist);
        return { playlists: newPlaylists };
      });
    } catch (error: any) {
      // Ignore duplicate song errors
      if (!error.message?.includes('already')) {
        console.error('Failed to add song:', error);
      }
    }
  },

  removeSongFromPlaylist: async (playlistId: string, songId: string) => {
    const data = await api.removeSongFromPlaylist(playlistId, songId);
    const playlist = toPlaylist(data);

    set((state) => {
      const newPlaylists = new Map(state.playlists);
      newPlaylists.set(playlist.id, playlist);
      return { playlists: newPlaylists };
    });
  },

  toggleFavorite: async (playlistId: string) => {
    const playlist = get().playlists.get(playlistId);
    if (!playlist) return;

    const data = await api.updatePlaylist(playlistId, { isFavorite: !playlist.isFavorite });
    const updated = toPlaylist(data);

    set((state) => {
      const newPlaylists = new Map(state.playlists);
      newPlaylists.set(updated.id, updated);
      return { playlists: newPlaylists };
    });
  },

  updatePlaylistName: async (playlistId: string, name: string) => {
    const data = await api.updatePlaylist(playlistId, { name });
    const updated = toPlaylist(data);

    set((state) => {
      const newPlaylists = new Map(state.playlists);
      newPlaylists.set(updated.id, updated);
      return { playlists: newPlaylists };
    });
  },

  setLanguagePreference: (language: string) => {
    localStorage.setItem('playlist-manager:language', language);
    set({ languagePreference: language });
  },

  // Selectors
  getAllPlaylists: () => {
    return Array.from(get().playlists.values());
  },

  getFavoritePlaylists: () => {
    return Array.from(get().playlists.values()).filter((p) => p.isFavorite);
  },

  getPlaylistsByGenre: () => {
    const playlists = Array.from(get().playlists.values());
    const genreMap = new Map<string, Playlist[]>();

    playlists.forEach((playlist) => {
      const genre = playlist.genre;
      if (!genreMap.has(genre)) genreMap.set(genre, []);
      genreMap.get(genre)!.push(playlist);
    });

    genreMap.forEach((list) => list.sort((a, b) => a.name.localeCompare(b.name)));
    return genreMap;
  },

  getPlaylistByGenre: (genre: string) => {
    return Array.from(get().playlists.values()).find((p) => p.genre === genre);
  },
}));
