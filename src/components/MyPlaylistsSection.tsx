import React, { useState } from 'react';
import { usePlaylistStore } from '../store';
import { PlaylistCard } from './PlaylistCard';
import './components.css';

/**
 * MyPlaylistsSection component - Displays all playlists
 * Only one playlist can be expanded at a time (accordion)
 */
export const MyPlaylistsSection: React.FC = () => {
  const playlists = usePlaylistStore((state) => state.getAllPlaylists());
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleToggle = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="my-playlists-section">
      <h2>My Playlists</h2>
      {playlists.length === 0 ? (
        <p className="empty-state">
          No playlists yet. Create your first playlist to get started!
        </p>
      ) : (
        <div className="playlists-grid">
          {playlists.map((playlist) => (
            <PlaylistCard
              key={playlist.id}
              playlist={playlist}
              isExpanded={expandedId === playlist.id}
              onToggle={handleToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
};
