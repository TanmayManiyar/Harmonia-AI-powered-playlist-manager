import { beforeEach, describe, expect, it } from 'vitest';
import { usePlaylistStore } from './index';
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

describe('PlaylistStore', () => {
  beforeEach(resetStore);

  it('fetches playlists from the backend API', async () => {
    await api.createPlaylist('Rock');

    await usePlaylistStore.getState().fetchPlaylists();

    const playlists = usePlaylistStore.getState().getAllPlaylists();
    expect(playlists).toHaveLength(1);
    expect(playlists[0]?.genre).toBe('Rock');
    expect(playlists[0]?.name).toBe('Rock Playlist 1');
  });

  it('creates a playlist and stores the API result locally', async () => {
    const playlist = await usePlaylistStore.getState().createPlaylist('Jazz');

    expect(playlist.genre).toBe('Jazz');
    expect(playlist.name).toBe('Jazz Playlist 1');
    expect(usePlaylistStore.getState().getAllPlaylists()).toHaveLength(1);
  });

  it('deletes a playlist locally after the API delete succeeds', async () => {
    const playlist = await usePlaylistStore.getState().createPlaylist('Pop');

    await usePlaylistStore.getState().deletePlaylist(playlist.id);

    expect(usePlaylistStore.getState().getAllPlaylists()).toHaveLength(0);
  });

  it('adds and removes songs through the backend API', async () => {
    const playlist = await usePlaylistStore.getState().createPlaylist('Rock');
    const song: Song = {
      id: 'song-1',
      title: 'Test Song',
      artist: 'Test Artist',
      genre: 'Rock',
      isCustom: false,
    };

    await usePlaylistStore.getState().addSongToPlaylist(playlist.id, song);
    expect(usePlaylistStore.getState().getAllPlaylists()[0]?.songs).toHaveLength(1);

    await usePlaylistStore.getState().removeSongFromPlaylist(playlist.id, song.id);
    expect(usePlaylistStore.getState().getAllPlaylists()[0]?.songs).toHaveLength(0);
  });

  it('ignores duplicate song errors from the API', async () => {
    const playlist = await usePlaylistStore.getState().createPlaylist('Rock');
    const song: Song = {
      id: 'song-1',
      title: 'Test Song',
      artist: 'Test Artist',
      genre: 'Rock',
      isCustom: false,
    };

    await usePlaylistStore.getState().addSongToPlaylist(playlist.id, song);
    await usePlaylistStore.getState().addSongToPlaylist(playlist.id, song);

    expect(usePlaylistStore.getState().getAllPlaylists()[0]?.songs).toHaveLength(1);
  });

  it('updates favorite state and playlist names from API responses', async () => {
    const playlist = await usePlaylistStore.getState().createPlaylist('Rock');

    await usePlaylistStore.getState().toggleFavorite(playlist.id);
    expect(usePlaylistStore.getState().getAllPlaylists()[0]?.isFavorite).toBe(true);

    await usePlaylistStore.getState().updatePlaylistName(playlist.id, 'Road Trip Rock');
    expect(usePlaylistStore.getState().getAllPlaylists()[0]?.name).toBe('Road Trip Rock');
  });

  it('persists language preference locally', () => {
    usePlaylistStore.getState().setLanguagePreference('Hindi');

    expect(usePlaylistStore.getState().languagePreference).toBe('Hindi');
    expect(localStorage.getItem('playlist-manager:language')).toBe('Hindi');
  });

  it('groups and selects playlists by genre', async () => {
    await usePlaylistStore.getState().createPlaylist('Rock');
    await usePlaylistStore.getState().createPlaylist('Jazz');
    const favorite = await usePlaylistStore.getState().createPlaylist('Rock');
    await usePlaylistStore.getState().toggleFavorite(favorite.id);

    const grouped = usePlaylistStore.getState().getPlaylistsByGenre();

    expect(grouped.size).toBe(2);
    expect(grouped.get('Rock')).toHaveLength(2);
    expect(usePlaylistStore.getState().getFavoritePlaylists()).toHaveLength(1);
    expect(usePlaylistStore.getState().getPlaylistByGenre('Jazz')?.genre).toBe('Jazz');
  });
});
