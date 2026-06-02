import { beforeEach, describe, expect, it } from 'vitest';
import { PlaylistService } from './PlaylistService';
import { usePlaylistStore } from '../store';
import { Song } from '../models';
import { api } from '../services/api';

const resetStore = () => {
  (api as any).__reset();
  usePlaylistStore.setState({
    playlists: new Map(),
    languagePreference: 'en',
    isLoading: false,
  });
};

describe('PlaylistService', () => {
  let service: PlaylistService;

  beforeEach(() => {
    resetStore();
    service = new PlaylistService();
  });

  describe('createGenrePlaylist', () => {
    it('creates a playlist for a valid genre', async () => {
      const result = await service.createGenrePlaylist('Rock');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.genre).toBe('Rock');
        expect(result.value.name).toBe('Rock Playlist 1');
      }
    });

    it('rejects empty genre names', async () => {
      const result = await service.createGenrePlaylist('');

      expect(result.success).toBe(false);
      if (!result.success) expect(result.error).toContain('cannot be empty');
    });

    it('trims whitespace before creating the playlist', async () => {
      const result = await service.createGenrePlaylist('  Pop  ');

      expect(result.success).toBe(true);
      if (result.success) expect(result.value.genre).toBe('Pop');
    });
  });

  describe('addSong', () => {
    const createTestSong = (title: string, artist: string, genre: string): Song => ({
      id: `${title}-${artist}`,
      title,
      artist,
      genre,
      isCustom: false,
    });

    it('adds a song to the first matching genre playlist', async () => {
      await service.createGenrePlaylist('Rock');
      const song = createTestSong('Song 1', 'Artist 1', 'Rock');

      const result = await service.addSong(song);

      expect(result.success).toBe(true);
      expect(usePlaylistStore.getState().getPlaylistByGenre('Rock')?.songs).toHaveLength(1);
    });

    it('adds a genre-less song to the first available playlist', async () => {
      const playlist = await service.createGenrePlaylist('Rock');
      await service.createGenrePlaylist('Jazz');

      const result = await service.addSong(createTestSong('Universal Song', 'Artist', ''));

      expect(result.success).toBe(true);
      if (playlist.success) {
        expect(usePlaylistStore.getState().playlists.get(playlist.value.id)?.songs).toHaveLength(1);
      }
      expect(usePlaylistStore.getState().getPlaylistByGenre('Jazz')?.songs).toHaveLength(0);
    });

    it('rejects songs with empty title or artist', async () => {
      const emptyTitle = await service.addSong(createTestSong('', 'Artist', 'Rock'));
      const emptyArtist = await service.addSong(createTestSong('Song', '', 'Rock'));

      expect(emptyTitle.success).toBe(false);
      expect(emptyArtist.success).toBe(false);
    });

    it('fails when there are no playlists to receive the song', async () => {
      const result = await service.addSong(createTestSong('Song', 'Artist', 'Rock'));

      expect(result.success).toBe(false);
      if (!result.success) expect(result.error).toContain('No playlists exist');
    });
  });

  describe('addCustomSong', () => {
    const createTestSong = (title: string, artist: string, genre: string): Song => ({
      id: `${title}-${artist}`,
      title,
      artist,
      genre,
      isCustom: false,
    });

    it('adds a custom song to a specific playlist', async () => {
      const created = await service.createGenrePlaylist('Rock');
      expect(created.success).toBe(true);
      if (!created.success) return;

      const result = await service.addCustomSong(
        created.value.id,
        createTestSong('Jazz Song', 'Artist', 'Jazz')
      );

      expect(result.success).toBe(true);
      expect(usePlaylistStore.getState().playlists.get(created.value.id)?.songs[0]?.isCustom).toBe(true);
    });

    it('rejects invalid custom songs and missing playlists', async () => {
      const created = await service.createGenrePlaylist('Rock');
      expect(created.success).toBe(true);
      if (!created.success) return;

      expect((await service.addCustomSong(created.value.id, createTestSong('', 'Artist', 'Jazz'))).success).toBe(false);
      expect((await service.addCustomSong(created.value.id, createTestSong('Song', '', 'Jazz'))).success).toBe(false);
      expect((await service.addCustomSong('missing', createTestSong('Song', 'Artist', 'Jazz'))).success).toBe(false);
    });
  });

  describe('deletePlaylist', () => {
    it('deletes an existing playlist', async () => {
      const created = await service.createGenrePlaylist('Rock');
      expect(created.success).toBe(true);
      if (!created.success) return;

      expect(await service.deletePlaylist(created.value.id)).toBe(true);
      expect(usePlaylistStore.getState().playlists.get(created.value.id)).toBeUndefined();
    });

    it('returns false for a missing playlist', async () => {
      expect(await service.deletePlaylist('missing')).toBe(false);
    });
  });
});
