import React, { useState } from 'react';
import { Play, ListMusic, Music2, X } from 'lucide-react';
import { usePlaylistStore } from '../store';
import { PlaylistDetailModal } from './PlaylistDetailModal';
import { playPlaylist } from '../lib/playPlaylist';

/**
 * FreshPlaylistBanner — shown at the top of Home right after a playlist is
 * created (from any panel), so it can be played immediately instead of
 * hunting for it in the library.
 */
export const FreshPlaylistBanner: React.FC = () => {
  const lastCreatedId = usePlaylistStore((s) => s.lastCreatedId);
  const playlist = usePlaylistStore((s) => (s.lastCreatedId ? s.playlists.get(s.lastCreatedId) ?? null : null));
  const clearCreated = usePlaylistStore((s) => s.clearCreated);
  const [detailOpen, setDetailOpen] = useState(false);

  if (!lastCreatedId || !playlist) return null;

  const handlePlay = () => {
    playPlaylist(playlist);
    clearCreated();
  };

  return (
    <>
      <section
        aria-label="Newly created playlist"
        className="mb-8 flex flex-wrap items-center gap-4 rounded-2xl border-2 border-accent bg-accent/10 p-3 pr-4 shadow-[var(--shadow)]"
      >
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-accent text-accent-contrast" aria-hidden="true">
          <Music2 size={24} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-accent-ink">fresh out the kitchen 🍳</p>
          <p className="truncate font-display text-lg font-bold text-ink">{playlist.name}</p>
          <p className="text-xs text-muted">
            {playlist.genre} · {playlist.songs.length} songs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePlay}
            disabled={playlist.songs.length === 0}
            className="flex items-center gap-1.5 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-contrast shadow-[0_4px_0_0_rgba(0,0,0,0.22)] transition-all hover:brightness-110 active:translate-y-0.5 active:shadow-none disabled:opacity-50"
          >
            <Play size={15} className="translate-x-px" /> Play now
          </button>
          <button
            onClick={() => setDetailOpen(true)}
            className="flex items-center gap-1.5 rounded-full border-2 border-line-strong bg-surface px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-accent"
          >
            <ListMusic size={15} /> Open
          </button>
          <button
            onClick={clearCreated}
            aria-label="Dismiss"
            className="grid h-8 w-8 place-items-center rounded-full text-muted transition-colors hover:bg-surface hover:text-ink"
          >
            <X size={16} />
          </button>
        </div>
      </section>
      <PlaylistDetailModal playlist={playlist} isOpen={detailOpen} onClose={() => setDetailOpen(false)} />
    </>
  );
};
