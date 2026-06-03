import React, { useState } from 'react';
import { usePlaylistStore } from '../store';
import { PlaylistCard } from './PlaylistCard';
import { PlaylistDetailModal } from './PlaylistDetailModal';

export const GenreSection: React.FC = () => {
  const playlistsByGenre = usePlaylistStore((s) => s.getPlaylistsByGenre());
  const allPlaylists = usePlaylistStore((s) => s.getAllPlaylists());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = allPlaylists.find((p) => p.id === selectedId) ?? null;

  const genreEntries = Array.from(playlistsByGenre.entries()).sort((a, b) => a[0].localeCompare(b[0]));

  return (
    <section>
      <h2 className="mb-6 font-display text-3xl font-semibold tracking-tight text-ink">Playlists by Genre</h2>
      {genreEntries.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line bg-surface/50 px-7 py-14 text-center text-sm text-muted">
          No playlists yet. Create playlists to see them organized by genre.
        </p>
      ) : (
        <div className="flex flex-col gap-9">
          {genreEntries.map(([genre, playlists]) => (
            <div key={genre} className="genre-group">
              <h3 className="genre-header mb-3.5 border-l-2 border-accent pl-3 font-display text-lg font-semibold text-ink-soft">
                {genre}
              </h3>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-4">
                {playlists.map((playlist, i) => (
                  <PlaylistCard key={playlist.id} playlist={playlist} onOpen={setSelectedId} index={i + 1} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      <PlaylistDetailModal playlist={selected} isOpen={selected !== null} onClose={() => setSelectedId(null)} />
    </section>
  );
};
