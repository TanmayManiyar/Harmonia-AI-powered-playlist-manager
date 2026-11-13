import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PlaylistDetailModal } from './PlaylistDetailModal';
import { Playlist } from '../models';

const playlist: Playlist = {
  id: 'p1',
  name: 'Trending Jazz',
  genre: 'Jazz',
  songs: [{ id: 's1', title: 'So What', artist: 'Miles', genre: 'Jazz', isCustom: false }],
  isFavorite: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('PlaylistDetailModal', () => {
  it('shows the full owner controls by default', () => {
    render(<PlaylistDetailModal playlist={playlist} isOpen onClose={() => {}} />);
    for (const name of [/Play all/, /Queue/, /Copy link/, /Rename/, /Favorite/, /Delete/]) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument();
    }
  });

  it('read-only mode hides owner controls but keeps play/queue and shows the owner', () => {
    render(<PlaylistDetailModal playlist={playlist} isOpen onClose={() => {}} readOnly ownerName="Sam" />);
    expect(screen.getByRole('button', { name: /Play all/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Queue/ })).toBeInTheDocument();
    expect(screen.getByText(/by Sam/)).toBeInTheDocument();
    for (const name of [/Rename/, /Delete/, /Copy link/, /YouTube/, /Favorite/, /Remove/]) {
      expect(screen.queryByRole('button', { name })).not.toBeInTheDocument();
    }
  });

  it('read-only mode offers Save to my library and reflects the saved state', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { rerender } = render(
      <PlaylistDetailModal playlist={playlist} isOpen onClose={() => {}} readOnly onSave={onSave} />
    );
    fireEvent.click(screen.getByRole('button', { name: /Save to my library/ }));
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    rerender(<PlaylistDetailModal playlist={playlist} isOpen onClose={() => {}} readOnly onSave={onSave} saved />);
    expect(screen.getByRole('button', { name: /Saved to library/ })).toBeDisabled();
  });
});
