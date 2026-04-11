import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PlaylistService } from './PlaylistService';
import { usePlaylistStore } from '../store';
import { Song } from '../models';

describe('PlaylistService', () => {
  let service: PlaylistService;

  beforeEach(() => {
    // Reset store state before each test
    const store = usePlaylistStore.getState();
    store.playlists.forEach((_, id) => {
      store.deletePlaylist(id);
    });
    service = new PlaylistService();
  });

  describe('createGenrePlaylist', () => {
    it('should create a playlist for a valid genre', () => {
      const result = service.createGenrePlaylist('Rock');
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.genre).toBe('Rock');
        expect(result.value.name).toBe('Rock Playlist');
        expect(result.value.songs).toEqual([]);
      }
    });

    it('should allow multiple playlists for the same genre', () => {
      const result1 = service.createGenrePlaylist('Jazz');
      const result2 = service.createGenrePlaylist('Jazz');
      
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      if (result1.success && result2.success) {
        expect(result1.value.id).not.toBe(result2.value.id);
        expect(result1.value.genre).toBe('Jazz');
        expect(result2.value.genre).toBe('Jazz');
      }
    });

    it('should reject empty genre names', () => {
      const result = service.createGenrePlaylist('');
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('cannot be empty');
      }
    });

    it('should trim whitespace from genre names', () => {
      const result = service.createGenrePlaylist('  Pop  ');
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.genre).toBe('Pop');
      }
    });
  });

  describe('addSong', () => {
    const createTestSong = (title: string, artist: string, genre: string): Song => ({
      id: `song-${Date.now()}-${Math.random()}`,
      title,
      artist,
      genre,
      isCustom: false,
    });

    it('should add song to existing genre playlist', () => {
      service.createGenrePlaylist('Rock');
      const song = createTestSong('Song 1', 'Artist 1', 'Rock');
      
      const result = service.addSong(song);
      
      expect(result.success).toBe(true);
      
      const store = usePlaylistStore.getState();
      const playlist = store.getPlaylistByGenre('Rock');
      expect(playlist?.songs).toHaveLength(1);
      expect(playlist?.songs[0]?.title).toBe('Song 1');
    });

    it('should create playlist automatically for new genre', () => {
      const song = createTestSong('Song 1', 'Artist 1', 'Classical');
      
      const result = service.addSong(song);
      
      expect(result.success).toBe(true);
      
      const store = usePlaylistStore.getState();
      const playlist = store.getPlaylistByGenre('Classical');
      expect(playlist).toBeDefined();
      expect(playlist?.songs).toHaveLength(1);
    });

    it('should add genre-less song to all playlists', () => {
      service.createGenrePlaylist('Rock');
      service.createGenrePlaylist('Jazz');
      
      const song = createTestSong('Universal Song', 'Artist', '');
      const result = service.addSong(song);
      
      expect(result.success).toBe(true);
      
      const store = usePlaylistStore.getState();
      const rockPlaylist = store.getPlaylistByGenre('Rock');
      const jazzPlaylist = store.getPlaylistByGenre('Jazz');
      
      expect(rockPlaylist?.songs).toHaveLength(1);
      expect(jazzPlaylist?.songs).toHaveLength(1);
    });

    it('should reject songs with empty title', () => {
      const song = createTestSong('', 'Artist', 'Rock');
      const result = service.addSong(song);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('title cannot be empty');
      }
    });

    it('should reject songs with empty artist', () => {
      const song = createTestSong('Song', '', 'Rock');
      const result = service.addSong(song);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('artist cannot be empty');
      }
    });

    it('should fail when adding genre-less song with no playlists', () => {
      const song = createTestSong('Song', 'Artist', '');
      const result = service.addSong(song);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('No playlists exist');
      }
    });
  });

  describe('addCustomSong', () => {
    const createTestSong = (title: string, artist: string, genre: string): Song => ({
      id: `song-${Date.now()}-${Math.random()}`,
      title,
      artist,
      genre,
      isCustom: false,
    });

    it('should add custom song to playlist ignoring genre mismatch', () => {
      const createResult = service.createGenrePlaylist('Rock');
      expect(createResult.success).toBe(true);
      
      if (createResult.success) {
        const playlistId = createResult.value.id;
        const song = createTestSong('Jazz Song', 'Artist', 'Jazz');
        
        const result = service.addCustomSong(playlistId, song);
        
        expect(result.success).toBe(true);
        
        const store = usePlaylistStore.getState();
        const playlist = store.playlists.get(playlistId);
        expect(playlist?.songs).toHaveLength(1);
        expect(playlist?.songs[0]?.isCustom).toBe(true);
      }
    });

    it('should reject custom song with empty title', () => {
      const createResult = service.createGenrePlaylist('Rock');
      expect(createResult.success).toBe(true);
      
      if (createResult.success) {
        const playlistId = createResult.value.id;
        const song = createTestSong('', 'Artist', 'Jazz');
        
        const result = service.addCustomSong(playlistId, song);
        
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toContain('title cannot be empty');
        }
      }
    });

    it('should reject custom song with empty artist', () => {
      const createResult = service.createGenrePlaylist('Rock');
      expect(createResult.success).toBe(true);
      
      if (createResult.success) {
        const playlistId = createResult.value.id;
        const song = createTestSong('Song', '', 'Jazz');
        
        const result = service.addCustomSong(playlistId, song);
        
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toContain('artist cannot be empty');
        }
      }
    });

    it('should fail when playlist does not exist', () => {
      const song = createTestSong('Song', 'Artist', 'Jazz');
      const result = service.addCustomSong('non-existent-id', song);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('not found');
      }
    });
  });

  describe('deletePlaylist', () => {
    it('should delete playlist when confirmed', async () => {
      const createResult = service.createGenrePlaylist('Rock');
      expect(createResult.success).toBe(true);
      
      if (createResult.success) {
        const playlistId = createResult.value.id;
        
        // Mock window.confirm to return true
        vi.spyOn(window, 'confirm').mockReturnValue(true);
        
        const deleted = await service.deletePlaylist(playlistId);
        
        expect(deleted).toBe(true);
        
        const store = usePlaylistStore.getState();
        expect(store.playlists.get(playlistId)).toBeUndefined();
      }
    });

    it('should not delete playlist when cancelled', async () => {
      const createResult = service.createGenrePlaylist('Rock');
      expect(createResult.success).toBe(true);
      
      if (createResult.success) {
        const playlistId = createResult.value.id;
        
        // Mock window.confirm to return false
        vi.spyOn(window, 'confirm').mockReturnValue(false);
        
        const deleted = await service.deletePlaylist(playlistId);
        
        expect(deleted).toBe(false);
        
        const store = usePlaylistStore.getState();
        expect(store.playlists.get(playlistId)).toBeDefined();
      }
    });

    it('should return false for non-existent playlist', async () => {
      const deleted = await service.deletePlaylist('non-existent-id');
      expect(deleted).toBe(false);
    });
  });
});
