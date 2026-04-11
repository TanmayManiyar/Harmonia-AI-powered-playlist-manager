import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PlaylistCard } from './PlaylistCard';
import { Playlist } from '../models';

describe('PlaylistCard', () => {
  let mockPlaylist: Playlist;

  beforeEach(() => {
    mockPlaylist = {
      id: 'test-1',
      name: 'Rock Playlist',
      genre: 'Rock',
      songs: [
        {
          id: 'song-1',
          title: 'Bohemian Rhapsody',
          artist: 'Queen',
          genre: 'Rock',
          isCustom: false,
        },
      ],
      isFavorite: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });

  it('should render playlist name', () => {
    render(<PlaylistCard playlist={mockPlaylist} />);
    expect(screen.getByText('Rock Playlist')).toBeDefined();
  });

  it('should render playlist genre', () => {
    render(<PlaylistCard playlist={mockPlaylist} />);
    expect(screen.getByText(/Genre: Rock/)).toBeDefined();
  });

  it('should render song count', () => {
    render(<PlaylistCard playlist={mockPlaylist} />);
    expect(screen.getByText(/1 songs/)).toBeDefined();
  });

  it('should render songs in the playlist', () => {
    render(<PlaylistCard playlist={mockPlaylist} />);
    expect(screen.getByText('Bohemian Rhapsody')).toBeDefined();
    expect(screen.getByText('Queen')).toBeDefined();
  });

  it('should show empty message when no songs', () => {
    const emptyPlaylist = { ...mockPlaylist, songs: [] };
    render(<PlaylistCard playlist={emptyPlaylist} />);
    expect(screen.getByText('No songs in this playlist')).toBeDefined();
  });
});
