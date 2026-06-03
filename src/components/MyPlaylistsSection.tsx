import React, { useState } from 'react';
import { usePlaylistStore } from '../store';
import { PlaylistCard } from './PlaylistCard';
import { PlaylistDetailModal } from './PlaylistDetailModal';

export const MyPlaylistsSection: React.FC = () => {
  const playlists = usePlaylistStore((s) => s.getAllPlaylists());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = playlists.find((p) => p.id === selectedId) ?? null;

  return (
    <section>
      <h2 className="mb-6 font-display text-3xl font-semibold tracking-tight text-ink">My Playlists</h2>
      {playlists.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line bg-surface/50 px-7 py-14 text-center text-sm text-muted">
          No playlists yet. Create your first playlist to get started.
        </p>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-4">
          {playlists.map((playlist, i) => (
            <PlaylistCard key={playlist.id} playlist={playlist} onOpen={setSelectedId} index={i + 1} />
          ))}
        </div>
      )}
      <PlaylistDetailModal playlist={selected} isOpen={selected !== null} onClose={() => setSelectedId(null)} />
    </section>
  );
};
