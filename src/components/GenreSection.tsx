import React, { useState } from 'react';
import { usePlaylistStore } from '../store';
import { PlaylistCard } from './PlaylistCard';
import { PlaylistDetailModal } from './PlaylistDetailModal';
import './components.css';

/**
 * GenreSection — playlists grouped by genre. Tapping a tile opens the
 * detail modal.
 */
export const GenreSection: React.FC = () => {
  const playlistsByGenre = usePlaylistStore((state) => state.getPlaylistsByGenre());
  const allPlaylists = usePlaylistStore((state) => state.getAllPlaylists());
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = allPlaylists.find((p) => p.id === selectedId) ?? null;

  const genreEntries = Array.from(playlistsByGenre.entries()).sort((a, b) =>
    a[0].localeCompare(b[0])
  );

  return (
    <div className="canvas-section">
      <h2 className="section-title">Playlists by Genre</h2>
      {genreEntries.length === 0 ? (
        <p className="empty-state">
          No playlists yet. Create playlists to see them organized by genre!
        </p>
      ) : (
        <div className="genre-groups">
          {genreEntries.map(([genre, playlists]) => (
            <div key={genre} className="genre-group">
              <h3 className="genre-header">{genre}</h3>
              <div className="tiles-grid">
                {playlists.map((playlist) => (
                  <PlaylistCard key={playlist.id} playlist={playlist} onOpen={setSelectedId} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <PlaylistDetailModal
        playlist={selected}
        isOpen={selected !== null}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
};
