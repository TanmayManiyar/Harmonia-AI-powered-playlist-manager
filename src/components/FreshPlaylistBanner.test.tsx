import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, render, screen, fireEvent } from '@testing-library/react';
import { FreshPlaylistBanner } from './FreshPlaylistBanner';
import { usePlaylistStore } from '../store';
import { usePlayerStore } from '../store/playerStore';
import { Playlist } from '../models';

vi.mock('../services/api', async (orig) => {
  const mod = await orig<typeof import('../services/api')>();
  return { ...mod, api: { ...mod.api, markPlayed: vi.fn() } };
});

const playlist: Playlist = {
  id: 'p1',
  name: 'Rainy Day Jazz',
  genre: 'Jazz',
  songs: [{ id: 's1', title: 'So What', artist: 'Miles Davis', youtubeId: 'abc' } as never],
  isFavorite: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('FreshPlaylistBanner', () => {
  beforeEach(() => {
    act(() => {
      usePlaylistStore.setState({ playlists: new Map([[playlist.id, playlist]]), lastCreatedId: null });
      usePlayerStore.getState().clear();
    });
  });

  it('renders nothing until a playlist has just been created', () => {
    const { container } = render(<FreshPlaylistBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the new playlist and plays it with one click, then goes away', () => {
    act(() => usePlaylistStore.getState().markCreated('p1'));
    render(<FreshPlaylistBanner />);
    expect(screen.getByText(/fresh out the kitchen/i)).toBeInTheDocument();
    expect(screen.getAllByText('Rainy Day Jazz').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: /play now/i }));

    expect(usePlayerStore.getState().queue).toHaveLength(1);
    expect(usePlayerStore.getState().isPlaying).toBe(true);
    expect(usePlaylistStore.getState().lastCreatedId).toBeNull();
    expect(screen.queryByText(/fresh out the kitchen/i)).not.toBeInTheDocument();
  });

  it('can be dismissed without playing', () => {
    act(() => usePlaylistStore.getState().markCreated('p1'));
    render(<FreshPlaylistBanner />);
    fireEvent.click(screen.getByRole('button', { name: /dismiss/i }));
    expect(usePlayerStore.getState().queue).toHaveLength(0);
    expect(usePlaylistStore.getState().lastCreatedId).toBeNull();
  });
});
