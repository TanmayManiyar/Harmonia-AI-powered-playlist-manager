import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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
    render(<PlaylistCard playlist={mockPlaylist} onOpen={() => {}} />);
    expect(screen.getByText('Rock Playlist')).toBeInTheDocument();
  });

  it('should render genre and song count in the meta line', () => {
    render(<PlaylistCard playlist={mockPlaylist} onOpen={() => {}} />);
    expect(screen.getByText(/Rock · 1 songs/)).toBeInTheDocument();
  });

  it('should call onOpen with the playlist id when the tile is clicked', () => {
    const onOpen = vi.fn();
    render(<PlaylistCard playlist={mockPlaylist} onOpen={onOpen} />);

    fireEvent.click(screen.getByLabelText('Open Rock Playlist'));

    expect(onOpen).toHaveBeenCalledWith('test-1');
  });

  it('should expose a favorite control', () => {
    render(<PlaylistCard playlist={mockPlaylist} onOpen={() => {}} />);
    expect(screen.getByLabelText('Add to favorites')).toBeInTheDocument();
  });
});
