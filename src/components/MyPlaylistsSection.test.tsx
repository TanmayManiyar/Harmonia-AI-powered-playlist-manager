import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MyPlaylistsSection } from './MyPlaylistsSection';
import { usePlaylistStore } from '../store';

describe('MyPlaylistsSection', () => {
  beforeEach(() => {
    // Reset store before each test
    const store = usePlaylistStore.getState();
    store.playlists.forEach((_, id) => {
      store.deletePlaylist(id);
    });
  });

  it('should display empty state when no playlists exist', () => {
    render(<MyPlaylistsSection />);
    
    expect(screen.getByText('My Playlists')).toBeInTheDocument();
    expect(screen.getByText(/No playlists yet/i)).toBeInTheDocument();
  });

  it('should display all playlists', () => {
    const store = usePlaylistStore.getState();
    store.createPlaylist('Rock');
    store.createPlaylist('Jazz');
    store.createPlaylist('Pop');

    render(<MyPlaylistsSection />);

    expect(screen.getByText('My Playlists')).toBeInTheDocument();
    expect(screen.getByText('Rock Playlist')).toBeInTheDocument();
    expect(screen.getByText('Jazz Playlist')).toBeInTheDocument();
    expect(screen.getByText('Pop Playlist')).toBeInTheDocument();
  });

  it('should update when playlists are added', () => {
    const { rerender } = render(<MyPlaylistsSection />);
    
    expect(screen.getByText(/No playlists yet/i)).toBeInTheDocument();

    const store = usePlaylistStore.getState();
    store.createPlaylist('Rock');

    rerender(<MyPlaylistsSection />);

    expect(screen.queryByText(/No playlists yet/i)).not.toBeInTheDocument();
    expect(screen.getByText('Rock Playlist')).toBeInTheDocument();
  });

  it('should update when playlists are removed', () => {
    const store = usePlaylistStore.getState();
    const playlist = store.createPlaylist('Rock');

    const { rerender } = render(<MyPlaylistsSection />);
    
    expect(screen.getByText('Rock Playlist')).toBeInTheDocument();

    store.deletePlaylist(playlist.id);

    rerender(<MyPlaylistsSection />);

    expect(screen.queryByText('Rock Playlist')).not.toBeInTheDocument();
    expect(screen.getByText(/No playlists yet/i)).toBeInTheDocument();
  });

  it('should display both favorite and non-favorite playlists', () => {
    const store = usePlaylistStore.getState();
    const playlist1 = store.createPlaylist('Rock');
    store.createPlaylist('Jazz');
    store.toggleFavorite(playlist1.id);

    render(<MyPlaylistsSection />);

    expect(screen.getByText('Rock Playlist')).toBeInTheDocument();
    expect(screen.getByText('Jazz Playlist')).toBeInTheDocument();
  });
});
