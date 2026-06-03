import React, { useState } from 'react';
import { usePlaylistStore } from '../store';
import { PlaylistCard } from './PlaylistCard';
import { PlaylistDetailModal } from './PlaylistDetailModal';
import './components.css';

/**
 * MyPlaylistsSection — grid of all playlists. Tapping a tile opens the
 * detail modal.
 */
export const MyPlaylistsSection: React.FC = () => {
  const playlists = usePlaylistStore((state) => state.getAllPlaylists());
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = playlists.find((p) => p.id === selectedId) ?? null;

  return (
    <div className="canvas-section">
      <h2 className="section-title">My Playlists</h2>
      {playlists.length === 0 ? (
        <p className="empty-state">
          No playlists yet. Create your first playlist to get started!
        </p>
      ) : (
        <div className="tiles-grid">
          {playlists.map((playlist) => (
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
