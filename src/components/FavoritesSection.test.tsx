import { describe, it, expect, beforeEach } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { FavoritesSection } from './FavoritesSection';
import { usePlaylistStore } from '../store';
import { Playlist } from '../models';

const makePlaylist = (id: string, genre: string, isFavorite = false): Playlist => ({
  id,
  name: `${genre} Playlist 1`,
  genre,
  songs: [],
  isFavorite,
  createdAt: new Date(),
  updatedAt: new Date(),
});

const setPlaylists = (playlists: Playlist[]) => {
  act(() => {
    usePlaylistStore.setState({
      playlists: new Map(playlists.map((playlist) => [playlist.id, playlist])),
      isLoading: false,
    });
  });
};

describe('FavoritesSection', () => {
  beforeEach(() => {
    setPlaylists([]);
  });

  it('should display empty state when no favorites exist', () => {
    render(<FavoritesSection />);
    
    expect(screen.getByText('Favorites')).toBeInTheDocument();
    expect(screen.getByText(/No favorite playlists yet/i)).toBeInTheDocument();
  });

  it('should display only favorite playlists', () => {
    setPlaylists([
      makePlaylist('rock', 'Rock', true),
      makePlaylist('jazz', 'Jazz', true),
      makePlaylist('pop', 'Pop'),
    ]);

    render(<FavoritesSection />);

    expect(screen.getByText('Favorites')).toBeInTheDocument();
    expect(screen.getByText('Rock Playlist 1')).toBeInTheDocument();
    expect(screen.getByText('Jazz Playlist 1')).toBeInTheDocument();
    expect(screen.queryByText('Pop Playlist 1')).not.toBeInTheDocument();
  });

  it('should update when favorite status changes', () => {
    const playlist = makePlaylist('rock', 'Rock');
    setPlaylists([playlist]);

    const { rerender } = render(<FavoritesSection />);
    
    expect(screen.getByText(/No favorite playlists yet/i)).toBeInTheDocument();

    setPlaylists([{ ...playlist, isFavorite: true }]);

    rerender(<FavoritesSection />);

    expect(screen.queryByText(/No favorite playlists yet/i)).not.toBeInTheDocument();
    expect(screen.getByText('Rock Playlist 1')).toBeInTheDocument();
  });

  it('should remove playlist when unfavorited', () => {
    const playlist = makePlaylist('rock', 'Rock', true);
    setPlaylists([playlist]);

    const { rerender } = render(<FavoritesSection />);
    
    expect(screen.getByText('Rock Playlist 1')).toBeInTheDocument();

    setPlaylists([{ ...playlist, isFavorite: false }]);

    rerender(<FavoritesSection />);

    expect(screen.queryByText('Rock Playlist 1')).not.toBeInTheDocument();
    expect(screen.getByText(/No favorite playlists yet/i)).toBeInTheDocument();
  });

  it('should show empty state when all favorites are removed', () => {
    const rock = makePlaylist('rock', 'Rock', true);
    const jazz = makePlaylist('jazz', 'Jazz', true);
    setPlaylists([rock, jazz]);

    const { rerender } = render(<FavoritesSection />);
    
    expect(screen.getByText('Rock Playlist 1')).toBeInTheDocument();
    expect(screen.getByText('Jazz Playlist 1')).toBeInTheDocument();

    setPlaylists([
      { ...rock, isFavorite: false },
      { ...jazz, isFavorite: false },
    ]);

    rerender(<FavoritesSection />);

    expect(screen.queryByText('Rock Playlist 1')).not.toBeInTheDocument();
    expect(screen.queryByText('Jazz Playlist 1')).not.toBeInTheDocument();
    expect(screen.getByText(/No favorite playlists yet/i)).toBeInTheDocument();
  });

  it('should update when favorite playlist is deleted', () => {
    setPlaylists([makePlaylist('rock', 'Rock', true)]);

    const { rerender } = render(<FavoritesSection />);
    
    expect(screen.getByText('Rock Playlist 1')).toBeInTheDocument();

    setPlaylists([]);

    rerender(<FavoritesSection />);

    expect(screen.queryByText('Rock Playlist 1')).not.toBeInTheDocument();
    expect(screen.getByText(/No favorite playlists yet/i)).toBeInTheDocument();
  });
});
