import { describe, it, expect, beforeEach } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { MyPlaylistsSection } from './MyPlaylistsSection';
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

describe('MyPlaylistsSection', () => {
  beforeEach(() => {
    setPlaylists([]);
  });

  it('should display empty state when no playlists exist', () => {
    render(<MyPlaylistsSection />);
    
    expect(screen.getByText('My Playlists')).toBeInTheDocument();
    expect(screen.getByText(/No playlists yet/i)).toBeInTheDocument();
  });

  it('should display all playlists', () => {
    setPlaylists([
      makePlaylist('rock', 'Rock'),
      makePlaylist('jazz', 'Jazz'),
      makePlaylist('pop', 'Pop'),
    ]);

    render(<MyPlaylistsSection />);

    expect(screen.getByText('My Playlists')).toBeInTheDocument();
    expect(screen.getByText('Rock Playlist 1')).toBeInTheDocument();
    expect(screen.getByText('Jazz Playlist 1')).toBeInTheDocument();
    expect(screen.getByText('Pop Playlist 1')).toBeInTheDocument();
  });

  it('should update when playlists are added', () => {
    const { rerender } = render(<MyPlaylistsSection />);
    
    expect(screen.getByText(/No playlists yet/i)).toBeInTheDocument();

    setPlaylists([makePlaylist('rock', 'Rock')]);

    rerender(<MyPlaylistsSection />);

    expect(screen.queryByText(/No playlists yet/i)).not.toBeInTheDocument();
    expect(screen.getByText('Rock Playlist 1')).toBeInTheDocument();
  });

  it('should update when playlists are removed', () => {
    setPlaylists([makePlaylist('rock', 'Rock')]);

    const { rerender } = render(<MyPlaylistsSection />);
    
    expect(screen.getByText('Rock Playlist 1')).toBeInTheDocument();

    setPlaylists([]);

    rerender(<MyPlaylistsSection />);

    expect(screen.queryByText('Rock Playlist 1')).not.toBeInTheDocument();
    expect(screen.getByText(/No playlists yet/i)).toBeInTheDocument();
  });

  it('should display both favorite and non-favorite playlists', () => {
    setPlaylists([
      makePlaylist('rock', 'Rock', true),
      makePlaylist('jazz', 'Jazz'),
    ]);

    render(<MyPlaylistsSection />);

    expect(screen.getByText('Rock Playlist 1')).toBeInTheDocument();
    expect(screen.getByText('Jazz Playlist 1')).toBeInTheDocument();
  });
});
