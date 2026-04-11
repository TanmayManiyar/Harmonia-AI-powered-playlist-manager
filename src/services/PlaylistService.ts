import { Playlist, Song } from '../models';
import { usePlaylistStore } from '../store';

/**
 * Result type for operations that can fail
 */
export type Result<T, E> = { success: true; value: T } | { success: false; error: E };

/**
 * PlaylistService - Business logic for playlist operations
 * Wraps Zustand store actions with validation
 */
export class PlaylistService {
  /**
   * Create a genre-based playlist
   */
  async createGenrePlaylist(genre: string): Promise<Result<Playlist, string>> {
    const trimmedGenre = genre.trim();
    if (!trimmedGenre) {
      return { success: false, error: 'Genre name cannot be empty' };
    }

    try {
      const store = usePlaylistStore.getState();
      const playlist = await store.createPlaylist(trimmedGenre);
      return { success: true, value: playlist };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to create playlist' };
    }
  }

  /**
   * Add a song to a specific playlist
   */
  async addSong(song: Song, targetPlaylistId?: string): Promise<Result<void, string>> {
    if (!song.title?.trim()) {
      return { success: false, error: 'Song title cannot be empty' };
    }
    if (!song.artist?.trim()) {
      return { success: false, error: 'Song artist cannot be empty' };
    }

    try {
      const store = usePlaylistStore.getState();

      if (targetPlaylistId) {
        await store.addSongToPlaylist(targetPlaylistId, song);
        return { success: true, value: undefined };
      }

      // Add to first matching genre playlist or first available
      const allPlaylists = store.getAllPlaylists();
      if (allPlaylists.length === 0) {
        return { success: false, error: 'No playlists exist to add the song to' };
      }

      const genre = song.genre?.trim();
      let playlist = genre
        ? allPlaylists.find((p) => p.genre.toLowerCase() === genre.toLowerCase())
        : undefined;

      if (!playlist) {
        playlist = allPlaylists[0];
      }

      await store.addSongToPlaylist(playlist!.id, song);
      return { success: true, value: undefined };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to add song' };
    }
  }

  /**
   * Add a custom song to a specific playlist
   */
  async addCustomSong(playlistId: string, song: Song): Promise<Result<void, string>> {
    if (!song.title?.trim()) {
      return { success: false, error: 'Song title cannot be empty' };
    }
    if (!song.artist?.trim()) {
      return { success: false, error: 'Song artist cannot be empty' };
    }

    try {
      const store = usePlaylistStore.getState();
      const playlist = store.playlists.get(playlistId);
      if (!playlist) {
        return { success: false, error: 'Playlist not found' };
      }

      const customSong: Song = { ...song, isCustom: true };
      await store.addSongToPlaylist(playlistId, customSong);
      return { success: true, value: undefined };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to add custom song' };
    }
  }

  /**
   * Delete a playlist
   */
  async deletePlaylist(playlistId: string): Promise<boolean> {
    try {
      const store = usePlaylistStore.getState();
      await store.deletePlaylist(playlistId);
      return true;
    } catch {
      return false;
    }
  }
}
