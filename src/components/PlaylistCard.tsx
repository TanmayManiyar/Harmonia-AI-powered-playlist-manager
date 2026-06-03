import React from 'react';
import { Music, Heart } from 'lucide-react';
import { Playlist } from '../models';
import { usePlaylistStore } from '../store';
import './components.css';

interface PlaylistCardProps {
  playlist: Playlist;
  onOpen: (id: string) => void;
}

/**
 * PlaylistCard — a compact glass tile. Tapping it opens the full
 * PlaylistDetailModal; the favorite heart toggles inline without opening.
 */
export const PlaylistCard: React.FC<PlaylistCardProps> = ({ playlist, onOpen }) => {
  const toggleFavorite = usePlaylistStore((state) => state.toggleFavorite);

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(playlist.id);
  };

  return (
    <button
      className="playlist-tile glass"
      onClick={() => onOpen(playlist.id)}
      aria-label={`Open ${playlist.name}`}
    >
      <div className="tile-cover">
        <Music size={28} strokeWidth={2} />
        <span
          className={`tile-fav ${playlist.isFavorite ? 'active' : ''}`}
          onClick={handleFavorite}
          role="button"
          aria-label={playlist.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart size={16} fill={playlist.isFavorite ? 'currentColor' : 'none'} />
        </span>
      </div>
      <div className="tile-body">
        <h3 className="tile-name">{playlist.name}</h3>
        <p className="tile-meta">
          {playlist.genre} · {playlist.songs.length} songs
        </p>
      </div>
    </button>
  );
};
