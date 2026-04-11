import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FavoritesSection } from './FavoritesSection';
import { usePlaylistStore } from '../store';

describe('FavoritesSection', () => {
  beforeEach(() => {
    // Reset store before each test
    const store = usePlaylistStore.getState();
    store.playlists.forEach((_, id) => {
      store.deletePlaylist(id);
    });
  });

  it('should display empty state when no favorites exist', () => {
    render(<FavoritesSection />);
    
    expect(screen.getByText('Favorites')).toBeInTheDocument();
    expect(screen.getByText(/No favorite playlists yet/i)).toBeInTheDocument();
  });

  it('should display only favorite playlists', () => {
    const store = usePlaylistStore.getState();
    const playlist1 = store.createPlaylist('Rock');
    const playlist2 = store.createPlaylist('Jazz');
    store.createPlaylist('Pop');
    
    store.toggleFavorite(playlist1.id);
    store.toggleFavorite(playlist2.id);

    render(<FavoritesSection />);

    expect(screen.getByText('Favorites')).toBeInTheDocument();
    expect(screen.getByText('Rock Playlist')).toBeInTheDocument();
    expect(screen.getByText('Jazz Playlist')).toBeInTheDocument();
    expect(screen.queryByText('Pop Playlist')).not.toBeInTheDocument();
  });

  it('should update when favorite status changes', () => {
    const store = usePlaylistStore.getState();
    const playlist = store.createPlaylist('Rock');

    const { rerender } = render(<FavoritesSection />);
    
    expect(screen.getByText(/No favorite playlists yet/i)).toBeInTheDocument();

    store.toggleFavorite(playlist.id);

    rerender(<FavoritesSection />);

    expect(screen.queryByText(/No favorite playlists yet/i)).not.toBeInTheDocument();
    expect(screen.getByText('Rock Playlist')).toBeInTheDocument();
  });

  it('should remove playlist when unfavorited', () => {
    const store = usePlaylistStore.getState();
    const playlist = store.createPlaylist('Rock');
    store.toggleFavorite(playlist.id);

    const { rerender } = render(<FavoritesSection />);
    
    expect(screen.getByText('Rock Playlist')).toBeInTheDocument();

    store.toggleFavorite(playlist.id);

    rerender(<FavoritesSection />);

    expect(screen.queryByText('Rock Playlist')).not.toBeInTheDocument();
    expect(screen.getByText(/No favorite playlists yet/i)).toBeInTheDocument();
  });

  it('should show empty state when all favorites are removed', () => {
    const store = usePlaylistStore.getState();
    const playlist1 = store.createPlaylist('Rock');
    const playlist2 = store.createPlaylist('Jazz');
    store.toggleFavorite(playlist1.id);
    store.toggleFavorite(playlist2.id);

    const { rerender } = render(<FavoritesSection />);
    
    expect(screen.getByText('Rock Playlist')).toBeInTheDocument();
    expect(screen.getByText('Jazz Playlist')).toBeInTheDocument();

    store.toggleFavorite(playlist1.id);
    store.toggleFavorite(playlist2.id);

    rerender(<FavoritesSection />);

    expect(screen.queryByText('Rock Playlist')).not.toBeInTheDocument();
    expect(screen.queryByText('Jazz Playlist')).not.toBeInTheDocument();
    expect(screen.getByText(/No favorite playlists yet/i)).toBeInTheDocument();
  });

  it('should update when favorite playlist is deleted', () => {
    const store = usePlaylistStore.getState();
    const playlist = store.createPlaylist('Rock');
    store.toggleFavorite(playlist.id);

    const { rerender } = render(<FavoritesSection />);
    
    expect(screen.getByText('Rock Playlist')).toBeInTheDocument();

    store.deletePlaylist(playlist.id);

    rerender(<FavoritesSection />);

    expect(screen.queryByText('Rock Playlist')).not.toBeInTheDocument();
    expect(screen.getByText(/No favorite playlists yet/i)).toBeInTheDocument();
  });
});
