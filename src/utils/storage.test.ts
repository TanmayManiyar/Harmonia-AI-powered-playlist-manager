import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  savePlaylists,
  loadPlaylists,
  saveLanguagePreference,
  loadLanguagePreference,
  clearStorage,
} from './storage';
import { Playlist } from '../models';

describe('Storage Utilities', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('Playlist Storage', () => {
    it('should save and load playlists correctly', () => {
      const playlists = new Map<string, Playlist>();
      const playlist: Playlist = {
        id: 'test-1',
        name: 'Rock Playlist',
        genre: 'Rock',
        songs: [],
        isFavorite: false,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };
      playlists.set('test-1', playlist);

      savePlaylists(playlists);
      const loaded = loadPlaylists();

      expect(loaded.size).toBe(1);
      const loadedPlaylist = loaded.get('test-1');
      expect(loadedPlaylist).toBeDefined();
      expect(loadedPlaylist?.name).toBe('Rock Playlist');
      expect(loadedPlaylist?.genre).toBe('Rock');
      expect(loadedPlaylist?.createdAt).toBeInstanceOf(Date);
      expect(loadedPlaylist?.updatedAt).toBeInstanceOf(Date);
    });

    it('should return empty Map when no playlists are stored', () => {
      const loaded = loadPlaylists();
      expect(loaded.size).toBe(0);
    });

    it('should handle corrupted playlist data gracefully', () => {
      localStorage.setItem('playlist-manager:playlists', 'invalid json');
      const loaded = loadPlaylists();
      expect(loaded.size).toBe(0);
    });

    it('should handle non-array playlist data gracefully', () => {
      localStorage.setItem('playlist-manager:playlists', '{"not": "an array"}');
      const loaded = loadPlaylists();
      expect(loaded.size).toBe(0);
    });

    it('should skip invalid playlist entries', () => {
      const data = [
        ['valid-1', { id: 'valid-1', name: 'Valid', genre: 'Rock', songs: [], isFavorite: false, createdAt: new Date(), updatedAt: new Date() }],
        ['invalid-1', null],
        ['valid-2', { id: 'valid-2', name: 'Valid 2', genre: 'Jazz', songs: [], isFavorite: false, createdAt: new Date(), updatedAt: new Date() }],
      ];
      localStorage.setItem('playlist-manager:playlists', JSON.stringify(data));
      
      const loaded = loadPlaylists();
      expect(loaded.size).toBe(2);
      expect(loaded.has('valid-1')).toBe(true);
      expect(loaded.has('valid-2')).toBe(true);
    });
  });

  describe('Language Preference Storage', () => {
    it('should save and load language preference correctly', () => {
      saveLanguagePreference('es');
      const loaded = loadLanguagePreference();
      expect(loaded).toBe('es');
    });

    it('should return default language when none is stored', () => {
      const loaded = loadLanguagePreference();
      expect(loaded).toBe('en');
    });

    it('should handle storage errors gracefully', () => {
      // Mock localStorage to throw error
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
      setItemSpy.mockImplementation(() => {
        throw new Error('Storage full');
      });

      // Should not throw
      expect(() => saveLanguagePreference('fr')).not.toThrow();

      setItemSpy.mockRestore();
    });
  });

  describe('Clear Storage', () => {
    it('should clear all stored data', () => {
      // Set some data
      saveLanguagePreference('es');
      savePlaylists(new Map([['test', { id: 'test', name: 'Test', genre: 'Rock', songs: [], isFavorite: false, createdAt: new Date(), updatedAt: new Date() }]]));
      
      // Verify data exists
      expect(localStorage.getItem('playlist-manager:language')).toBeTruthy();
      expect(localStorage.getItem('playlist-manager:playlists')).toBeTruthy();
      
      // Clear storage
      clearStorage();
      
      // Verify data is cleared
      expect(localStorage.getItem('playlist-manager:language')).toBeNull();
      expect(localStorage.getItem('playlist-manager:playlists')).toBeNull();
    });
  });
});
