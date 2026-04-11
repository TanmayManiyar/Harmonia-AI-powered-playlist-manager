import React, { useState } from 'react';
import { usePlaylistStore } from '../store';
import { PlaylistCard } from './PlaylistCard';
import './components.css';

/**
 * FavoritesSection component - Displays favorite playlists
 * Only one playlist can be expanded at a time (accordion)
 */
export const FavoritesSection: React.FC = () => {
  const favoritePlaylists = usePlaylistStore((state) => state.getFavoritePlaylists());
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleToggle = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="favorites-section">
      <h2>Favorites</h2>
      {favoritePlaylists.length === 0 ? (
        <p className="empty-state">
          No favorite playlists yet. Click the star icon on any playlist to add it to favorites!
        </p>
      ) : (
        <div className="playlists-grid">
          {favoritePlaylists.map((playlist) => (
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
