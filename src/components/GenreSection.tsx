import React, { useState } from 'react';
import { usePlaylistStore } from '../store';
import { PlaylistCard } from './PlaylistCard';
import './components.css';

/**
 * GenreSection component - Displays playlists grouped by genre
 * Only one playlist can be expanded at a time across all genre groups (accordion)
 */
export const GenreSection: React.FC = () => {
  const playlistsByGenre = usePlaylistStore((state) => state.getPlaylistsByGenre());
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleToggle = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const genreEntries = Array.from(playlistsByGenre.entries()).sort((a, b) =>
    a[0].localeCompare(b[0])
  );

  return (
    <div className="genre-section">
      <h2>Playlists by Genre</h2>
      {genreEntries.length === 0 ? (
        <p className="empty-state">
          No playlists yet. Create playlists to see them organized by genre!
        </p>
      ) : (
        <div className="genre-groups">
          {genreEntries.map(([genre, playlists]) => (
            <div key={genre} className="genre-group">
              <h3 className="genre-header">{genre}</h3>
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
