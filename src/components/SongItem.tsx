import React from 'react';
import { Song } from '../models';
import './components.css';

interface SongItemProps {
  song: Song;
  onRemove?: (songId: string) => void;
  showRemoveButton?: boolean;
}

/**
 * SongItem component - Displays a single song with metadata
 * Shows song title, artist, genre, and optional remove button
 * Displays custom song indicator if isCustom is true
 */
export const SongItem: React.FC<SongItemProps> = ({
  song,
  onRemove,
  showRemoveButton = true,
}) => {
  const handleRemove = () => {
    if (onRemove) {
      onRemove(song.id);
    }
  };

  return (
    <div className="song-item">
      <div className="song-info">
        <div className="song-title">
          {song.title}
          {song.isCustom && <span className="custom-badge">Custom</span>}
        </div>
        <div className="song-details">
          <span className="song-artist">{song.artist}</span>
          <span className="song-separator">•</span>
          <span className="song-genre">{song.genre}</span>
        </div>
      </div>
      {showRemoveButton && onRemove && (
        <button
          className="remove-button"
          onClick={handleRemove}
          aria-label={`Remove ${song.title}`}
        >
          Remove
        </button>
      )}
    </div>
  );
};
