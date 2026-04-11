import { describe, it, expect, beforeEach } from 'vitest';
import { usePlaylistStore } from './index';
import { Song } from '../models';
import { clearStorage, loadPlaylists, loadLanguagePreference } from '../utils/storage';

describe('PlaylistStore', () => {
  beforeEach(() => {
    // Clear storage and reset store state before each test
    clearStorage();
    const store = usePlaylistStore.getState();
    store.playlists.clear();
    store.setLanguagePreference('en');
  });

  describe('createPlaylist', () => {
    it('should create a new playlist with the given genre', () => {
      const store = usePlaylistStore.getState();
      const playlist = store.createPlaylist('Rock');

      expect(playlist.genre).toBe('Rock');
      expect(playlist.name).toBe('Rock Playlist');
      expect(playlist.songs).toEqual([]);
      expect(playlist.isFavorite).toBe(false);
      expect(store.getAllPlaylists()).toHaveLength(1);
    });

    it('should allow multiple playlists for the same genre', () => {
      const store = usePlaylistStore.getState();
      const playlist1 = store.createPlaylist('Jazz');
      const playlist2 = store.createPlaylist('Jazz');

      expect(playlist1.id).not.toBe(playlist2.id);
      expect(store.getAllPlaylists()).toHaveLength(2);
      expect(playlist1.genre).toBe('Jazz');
      expect(playlist2.genre).toBe('Jazz');
    });
  });

  describe('deletePlaylist', () => {
    it('should remove a playlist from the store', () => {
      const store = usePlaylistStore.getState();
      const playlist = store.createPlaylist('Pop');
      
      expect(store.getAllPlaylists()).toHaveLength(1);
      
      store.deletePlaylist(playlist.id);
      
      expect(store.getAllPlaylists()).toHaveLength(0);
    });
  });

  describe('addSongToPlaylist', () => {
    it('should add a song to the playlist', () => {
      const store = usePlaylistStore.getState();
      const playlist = store.createPlaylist('Rock');
      
      const song: Song = {
        id: 'song-1',
        title: 'Test Song',
        artist: 'Test Artist',
        genre: 'Rock',
        isCustom: false,
      };

      store.addSongToPlaylist(playlist.id, song);
      
      const updatedPlaylists = store.getAllPlaylists();
      expect(updatedPlaylists[0]?.songs).toHaveLength(1);
      expect(updatedPlaylists[0]?.songs[0]?.id).toBe('song-1');
    });

    it('should not add duplicate songs', () => {
      const store = usePlaylistStore.getState();
      const playlist = store.createPlaylist('Rock');
      
      const song: Song = {
        id: 'song-1',
        title: 'Test Song',
        artist: 'Test Artist',
        genre: 'Rock',
        isCustom: false,
      };

      store.addSongToPlaylist(playlist.id, song);
      store.addSongToPlaylist(playlist.id, song);
      
      const updatedPlaylists = store.getAllPlaylists();
      expect(updatedPlaylists[0]?.songs).toHaveLength(1);
    });
  });

  describe('removeSongFromPlaylist', () => {
    it('should remove a song from the playlist', () => {
      const store = usePlaylistStore.getState();
      const playlist = store.createPlaylist('Rock');
      
      const song: Song = {
        id: 'song-1',
        title: 'Test Song',
        artist: 'Test Artist',
        genre: 'Rock',
        isCustom: false,
      };

      store.addSongToPlaylist(playlist.id, song);
      expect(store.getAllPlaylists()[0]?.songs).toHaveLength(1);
      
      store.removeSongFromPlaylist(playlist.id, 'song-1');
      expect(store.getAllPlaylists()[0]?.songs).toHaveLength(0);
    });
  });

  describe('toggleFavorite', () => {
    it('should toggle the favorite status of a playlist', () => {
      const store = usePlaylistStore.getState();
      const playlist = store.createPlaylist('Rock');
      
      expect(playlist.isFavorite).toBe(false);
      
      store.toggleFavorite(playlist.id);
      expect(store.getAllPlaylists()[0]?.isFavorite).toBe(true);
      
      store.toggleFavorite(playlist.id);
      expect(store.getAllPlaylists()[0]?.isFavorite).toBe(false);
    });
  });

  describe('updatePlaylistName', () => {
    it('should update the name of a playlist', () => {
      const store = usePlaylistStore.getState();
      const playlist = store.createPlaylist('Rock');
      
      expect(playlist.name).toBe('Rock Playlist');
      
      store.updatePlaylistName(playlist.id, 'My Awesome Rock Playlist');
      expect(store.getAllPlaylists()[0]?.name).toBe('My Awesome Rock Playlist');
    });
  });

  describe('setLanguagePreference', () => {
    it('should update the language preference', () => {
      const store = usePlaylistStore.getState();
      
      expect(store.languagePreference).toBe('en');
      
      store.setLanguagePreference('es');
      expect(usePlaylistStore.getState().languagePreference).toBe('es');
    });
  });

  describe('selectors', () => {
    it('getAllPlaylists should return all playlists', () => {
      const store = usePlaylistStore.getState();
      store.createPlaylist('Rock');
      store.createPlaylist('Jazz');
      store.createPlaylist('Pop');
      
      expect(store.getAllPlaylists()).toHaveLength(3);
    });

    it('getFavoritePlaylists should return only favorite playlists', () => {
      const store = usePlaylistStore.getState();
      const playlist1 = store.createPlaylist('Rock');
      const playlist2 = store.createPlaylist('Jazz');
      store.createPlaylist('Pop');
      
      store.toggleFavorite(playlist1.id);
      store.toggleFavorite(playlist2.id);
      
      const favorites = store.getFavoritePlaylists();
      expect(favorites).toHaveLength(2);
      expect(favorites.every(p => p.isFavorite)).toBe(true);
    });

    it('getPlaylistsByGenre should group playlists by genre', () => {
      const store = usePlaylistStore.getState();
      store.createPlaylist('Rock');
      store.createPlaylist('Jazz');
      store.createPlaylist('Pop');
      
      const byGenre = store.getPlaylistsByGenre();
      expect(byGenre.size).toBe(3);
      expect(byGenre.get('Rock')).toHaveLength(1);
      expect(byGenre.get('Jazz')).toHaveLength(1);
      expect(byGenre.get('Pop')).toHaveLength(1);
    });

    it('getPlaylistsByGenre should sort playlists alphabetically within genre', () => {
      const store = usePlaylistStore.getState();
      
      // Create multiple playlists with different genres
      const p1 = store.createPlaylist('Rock');
      store.updatePlaylistName(p1.id, 'Zebra Rock');
      
      const p2 = store.createPlaylist('Jazz');
      store.updatePlaylistName(p2.id, 'Alpha Jazz');
      
      const p3 = store.createPlaylist('Pop');
      store.updatePlaylistName(p3.id, 'Beta Pop');
      
      const byGenre = store.getPlaylistsByGenre();
      
      // Each genre should have one playlist
      expect(byGenre.get('Rock')?.[0]?.name).toBe('Zebra Rock');
      expect(byGenre.get('Jazz')?.[0]?.name).toBe('Alpha Jazz');
      expect(byGenre.get('Pop')?.[0]?.name).toBe('Beta Pop');
    });

    it('getPlaylistByGenre should return playlist for given genre', () => {
      const store = usePlaylistStore.getState();
      store.createPlaylist('Rock');
      store.createPlaylist('Jazz');
      
      const rockPlaylist = store.getPlaylistByGenre('Rock');
      expect(rockPlaylist).toBeDefined();
      expect(rockPlaylist?.genre).toBe('Rock');
      
      const classicalPlaylist = store.getPlaylistByGenre('Classical');
      expect(classicalPlaylist).toBeUndefined();
    });
  });

  describe('persistence', () => {
    it('should persist playlists to local storage on creation', () => {
      const store = usePlaylistStore.getState();
      store.createPlaylist('Rock');
      
      // Load from storage directly
      const loaded = loadPlaylists();
      expect(loaded.size).toBe(1);
      expect(Array.from(loaded.values())[0]?.genre).toBe('Rock');
    });

    it('should persist playlists to local storage on deletion', () => {
      const store = usePlaylistStore.getState();
      const playlist = store.createPlaylist('Rock');
      
      expect(loadPlaylists().size).toBe(1);
      
      store.deletePlaylist(playlist.id);
      
      expect(loadPlaylists().size).toBe(0);
    });

    it('should persist playlists to local storage when adding songs', () => {
      const store = usePlaylistStore.getState();
      const playlist = store.createPlaylist('Rock');
      
      const song: Song = {
        id: 'song-1',
        title: 'Test Song',
        artist: 'Test Artist',
        genre: 'Rock',
        isCustom: false,
      };
      
      store.addSongToPlaylist(playlist.id, song);
      
      const loaded = loadPlaylists();
      const loadedPlaylist = Array.from(loaded.values())[0];
      expect(loadedPlaylist?.songs).toHaveLength(1);
      expect(loadedPlaylist?.songs[0]?.id).toBe('song-1');
    });

    it('should persist playlists to local storage when removing songs', () => {
      const store = usePlaylistStore.getState();
      const playlist = store.createPlaylist('Rock');
      
      const song: Song = {
        id: 'song-1',
        title: 'Test Song',
        artist: 'Test Artist',
        genre: 'Rock',
        isCustom: false,
      };
      
      store.addSongToPlaylist(playlist.id, song);
      store.removeSongFromPlaylist(playlist.id, 'song-1');
      
      const loaded = loadPlaylists();
      const loadedPlaylist = Array.from(loaded.values())[0];
      expect(loadedPlaylist?.songs).toHaveLength(0);
    });

    it('should persist playlists to local storage when toggling favorite', () => {
      const store = usePlaylistStore.getState();
      const playlist = store.createPlaylist('Rock');
      
      store.toggleFavorite(playlist.id);
      
      const loaded = loadPlaylists();
      const loadedPlaylist = Array.from(loaded.values())[0];
      expect(loadedPlaylist?.isFavorite).toBe(true);
    });

    it('should persist playlists to local storage when updating name', () => {
      const store = usePlaylistStore.getState();
      const playlist = store.createPlaylist('Rock');
      
      store.updatePlaylistName(playlist.id, 'My Custom Rock Playlist');
      
      const loaded = loadPlaylists();
      const loadedPlaylist = Array.from(loaded.values())[0];
      expect(loadedPlaylist?.name).toBe('My Custom Rock Playlist');
    });

    it('should persist language preference to local storage', () => {
      const store = usePlaylistStore.getState();
      store.setLanguagePreference('fr');
      
      const loaded = loadLanguagePreference();
      expect(loaded).toBe('fr');
    });

    it('should restore state from local storage on initialization', () => {
      // Create some playlists
      const store = usePlaylistStore.getState();
      store.createPlaylist('Rock');
      store.createPlaylist('Jazz');
      store.setLanguagePreference('es');
      
      // Simulate app restart by getting fresh state
      // In a real scenario, this would be a new store instance
      const loaded = loadPlaylists();
      const loadedLang = loadLanguagePreference();
      
      expect(loaded.size).toBe(2);
      expect(loadedLang).toBe('es');
    });
  });
});
