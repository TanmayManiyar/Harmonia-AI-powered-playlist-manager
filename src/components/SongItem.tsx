import React from 'react';
import { Song } from '../models';

interface SongItemProps {
  song: Song;
  onRemove?: (songId: string) => void;
  showRemoveButton?: boolean;
}

/**
 * SongItem — a single row: title, artist · genre, optional remove.
 */
export const SongItem: React.FC<SongItemProps> = ({
  song,
  onRemove,
  showRemoveButton = true,
}) => {
  return (
    <div className="group flex items-center justify-between gap-3 rounded border border-transparent px-3 py-2.5 transition-colors hover:border-line hover:bg-paper-2">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-ink">{song.title}</span>
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
