import React, { useState } from 'react';
import { usePlaylistStore } from '../store';
import { PlaylistCard } from './PlaylistCard';
import { PlaylistDetailModal } from './PlaylistDetailModal';
import './components.css';

/**
 * FavoritesSection — grid of favorite playlists. Tapping a tile opens the
 * detail modal.
 */
export const FavoritesSection: React.FC = () => {
  const favoritePlaylists = usePlaylistStore((state) => state.getFavoritePlaylists());
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = favoritePlaylists.find((p) => p.id === selectedId) ?? null;

  return (
    <div className="canvas-section">
      <h2 className="section-title">Favorites</h2>
      {favoritePlaylists.length === 0 ? (
        <p className="empty-state">
          No favorite playlists yet. Tap the heart on any playlist to add it to favorites!
        </p>
      ) : (
        <div className="tiles-grid">
          {favoritePlaylists.map((playlist) => (
            <PlaylistCard key={playlist.id} playlist={playlist} onOpen={setSelectedId} />
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
