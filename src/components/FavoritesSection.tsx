import React, { useState } from 'react';
import { usePlaylistStore } from '../store';
import { PlaylistCard } from './PlaylistCard';
import { PlaylistDetailModal } from './PlaylistDetailModal';

export const FavoritesSection: React.FC = () => {
  const favoritePlaylists = usePlaylistStore((s) => s.getFavoritePlaylists());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = favoritePlaylists.find((p) => p.id === selectedId) ?? null;

  return (
    <section>
      <h2 className="mb-6 font-display text-3xl font-semibold tracking-tight text-ink">Favorites</h2>
      {favoritePlaylists.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line bg-surface/50 px-7 py-14 text-center text-sm text-muted">
          No favorite playlists yet. Tap the heart on any playlist to add it to favorites.
        </p>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-4">
          {favoritePlaylists.map((playlist, i) => (
            <PlaylistCard key={playlist.id} playlist={playlist} onOpen={setSelectedId} index={i + 1} />
          ))}
        </div>
      )}
      <PlaylistDetailModal playlist={selected} isOpen={selected !== null} onClose={() => setSelectedId(null)} />
    </section>
  );
};
