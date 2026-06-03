import React from 'react';
import { Heart, Play } from 'lucide-react';
import { Playlist } from '../models';
import { usePlaylistStore } from '../store';
import { usePlayerStore } from '../store/playerStore';
import { api } from '../services/api';
import { PlaylistCover } from './PlaylistCover';
import { recordRecentlyPlayed } from '../lib/recentlyPlayed';
import { cn } from '../lib/utils';

interface PlaylistCardProps {
  playlist: Playlist;
  onOpen: (id: string) => void;
  index?: number;
}

/**
 * PlaylistCard — an editorial glass-free tile. Tapping opens the detail
 * modal; the heart toggles favorite inline.
 */
export const PlaylistCard: React.FC<PlaylistCardProps> = ({ playlist, onOpen, index }) => {
  const toggleFavorite = usePlaylistStore((s) => s.toggleFavorite);
  const playQueue = usePlayerStore((s) => s.playQueue);

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(playlist.id);
  };

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const queued = playQueue(playlist.songs, 0);
    if (queued > 0) {
      recordRecentlyPlayed({
        id: playlist.id,
        name: playlist.name,
        genre: playlist.genre,
        songs: playlist.songs,
      });
      api.markPlayed(playlist.id);
    }
  };

  return (
    <button
      className="playlist-tile group flex flex-col overflow-hidden rounded-md border border-line bg-surface text-left shadow-[var(--shadow)] transition-all duration-200 hover:-translate-y-1 hover:border-line-strong hover:shadow-[var(--shadow-lg)]"
      onClick={() => onOpen(playlist.id)}
      aria-label={`Open ${playlist.name}`}
    >
      <div className="relative">
        <PlaylistCover
          name={playlist.name}
          genre={playlist.genre}
          index={index}
          className="aspect-[4/3] w-full"
        />
        <span
          onClick={handleFavorite}
          role="button"
          aria-label={playlist.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          className={cn(
            'absolute right-2.5 top-2.5 grid h-8 w-8 place-items-center rounded-full border border-line bg-surface/90 backdrop-blur transition-colors hover:bg-surface',
            playlist.isFavorite ? 'text-accent-ink' : 'text-muted'
          )}
        >
          <Heart size={15} fill={playlist.isFavorite ? 'currentColor' : 'none'} />
        </span>
        <span
          onClick={handlePlay}
          role="button"
          aria-label={`Play ${playlist.name}`}
          className="absolute bottom-2.5 right-2.5 grid h-9 w-9 translate-y-1 place-items-center rounded-full bg-accent text-accent-contrast opacity-0 shadow-[var(--shadow)] transition-all duration-200 hover:brightness-95 group-hover:translate-y-0 group-hover:opacity-100"
        >
          <Play size={16} className="translate-x-px" />
        </span>
      </div>
      <div className="px-3.5 py-3">
        <p className="tile-meta text-xs text-muted">
          {playlist.genre} · {playlist.songs.length} songs
        </p>
      </div>
    </button>
  );
};
