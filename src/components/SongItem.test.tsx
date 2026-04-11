import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SongItem } from './SongItem';
import { Song } from '../models';

describe('SongItem', () => {
  const mockSong: Song = {
    id: 'song-1',
    title: 'Bohemian Rhapsody',
    artist: 'Queen',
    genre: 'Rock',
    isCustom: false,
  };

  it('should render song title and artist', () => {
    render(<SongItem song={mockSong} />);
    expect(screen.getByText('Bohemian Rhapsody')).toBeDefined();
    expect(screen.getByText('Queen')).toBeDefined();
  });

  it('should render song genre', () => {
    render(<SongItem song={mockSong} />);
    expect(screen.getByText('Rock')).toBeDefined();
  });

  it('should show custom badge for custom songs', () => {
    const customSong = { ...mockSong, isCustom: true };
    render(<SongItem song={customSong} />);
    expect(screen.getByText('Custom')).toBeDefined();
  });

  it('should call onRemove when remove button is clicked', () => {
    const onRemove = vi.fn();
    render(<SongItem song={mockSong} onRemove={onRemove} />);
    
    const removeButton = screen.getByText('Remove');
    fireEvent.click(removeButton);
    
    expect(onRemove).toHaveBeenCalledWith('song-1');
  });

  it('should not show remove button when showRemoveButton is false', () => {
    render(<SongItem song={mockSong} showRemoveButton={false} />);
    expect(screen.queryByText('Remove')).toBeNull();
  });
});
