import React from 'react';
import { Play } from 'lucide-react';
import { Song } from '../models';
import { SongThumb } from './SongThumb';

interface SongItemProps {
  song: Song;
  onRemove?: (songId: string) => void;
  onPlay?: (song: Song) => void;
  showRemoveButton?: boolean;
  isActive?: boolean;
}

/**
 * SongItem — a single row: title, artist · genre, optional play / remove.
 */
export const SongItem: React.FC<SongItemProps> = ({
  song,
  onRemove,
  onPlay,
  showRemoveButton = true,
  isActive = false,
}) => {
  const playable = Boolean(song.youtubeId);

  return (
    <div className="group flex items-center justify-between gap-3 rounded border border-transparent px-2 py-2 transition-colors hover:border-line hover:bg-paper-2">
      <div className="flex min-w-0 items-center gap-2.5">
        {onPlay ? (
          <button
            onClick={() => onPlay(song)}
            disabled={!playable}
            aria-label={`Play ${song.title}`}
            className="group/thumb relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-md disabled:cursor-default"
          >
            <SongThumb youtubeId={song.youtubeId} title={song.title} iconSize={14} className="h-10 w-10 rounded-md" />
            {playable && (
              <span className="absolute inset-0 grid place-items-center bg-black/45 text-white opacity-0 transition-opacity group-hover/thumb:opacity-100">
                <Play size={15} className="translate-x-px" />
              </span>
            )}
          </button>
        ) : (
          <SongThumb youtubeId={song.youtubeId} title={song.title} iconSize={14} className="h-10 w-10 shrink-0 rounded-md" />
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={`truncate text-sm font-medium ${isActive ? 'text-accent-ink' : 'text-ink'}`}>
              {song.title}
            </span>
            {song.isCustom && (
              <span className="rounded-full border border-line bg-surface px-1.5 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-muted">
                Custom
              </span>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
            <span className="truncate">{song.artist}</span>
            <span aria-hidden="true">·</span>
            <span>{song.genre}</span>
          </div>
        </div>
      </div>
      {showRemoveButton && onRemove && (
        <button
          className="shrink-0 rounded px-2.5 py-1.5 text-xs font-medium text-muted opacity-0 transition-all hover:bg-danger/10 hover:text-danger group-hover:opacity-100"
          onClick={() => onRemove(song.id)}
          aria-label={`Remove ${song.title}`}
        >
          Remove
        </button>
      )}
    </div>
  );
};
