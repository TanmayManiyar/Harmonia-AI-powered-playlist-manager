import React, { useState } from 'react';
import { Song } from '../models';
import { api } from '../services/api';
import { usePlaylistStore } from '../store';
import './components.css';

/**
 * SearchPanel component - Interface for searching songs
 * Uses the backend YouTube API endpoint for search
 */
export const SearchPanel: React.FC = () => {
  const [query, setQuery] = useState('');
  const [genreFilter, setGenreFilter] = useState('');
  const [results, setResults] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const playlists = usePlaylistStore((state) => state.getAllPlaylists());
  const addSongToPlaylist = usePlaylistStore((state) => state.addSongToPlaylist);

  const commonGenres = ['', 'Rock', 'Pop', 'Jazz', 'Classical', 'Hip Hop', 'Electronic', 'Country'];

  const handleSearch = async () => {
    setError(null);
    setIsLoading(true);

    try {
      let songs: Song[];
      if (query.trim()) {
        songs = await api.searchSongs(query, genreFilter || undefined);
      } else if (genreFilter) {
        songs = await api.searchByGenre(genreFilter);
      } else {
        songs = [];
      }

      setResults(songs);
      if (songs.length === 0) {
        setError('No songs found matching your search');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleAddSongClick = (song: Song) => {
    setSelectedSong(song);
    setSelectedPlaylistId('');
    setMessage(null);
  };

  const handleCancelAdd = () => {
    setSelectedSong(null);
    setSelectedPlaylistId('');
    setMessage(null);
  };

  const handleConfirmAdd = async () => {
    if (!selectedSong) return;

    setMessage(null);

    try {
      if (selectedPlaylistId) {
        await addSongToPlaylist(selectedPlaylistId, selectedSong);
        setMessage({ type: 'success', text: `Added "${selectedSong.title}" to playlist` });
        setSelectedSong(null);
        setSelectedPlaylistId('');
      } else if (playlists.length > 0) {
        // Add to first playlist if no specific one selected
        await addSongToPlaylist(playlists[0]!.id, selectedSong);
        setMessage({ type: 'success', text: `Added "${selectedSong.title}" to ${playlists[0]!.name}` });
        setSelectedSong(null);
      } else {
        setMessage({ type: 'error', text: 'No playlists available. Create one first!' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to add song' });
    }
  };

  return (
    <div className="search-panel">
      <h2>Search Songs</h2>

      <div className="search-controls">
        <div className="search-input-group">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search by title or artist"
            className="search-input"
          />
          <select
            value={genreFilter}
            onChange={(e) => setGenreFilter(e.target.value)}
            className="genre-filter"
          >
            <option value="">All Genres</option>
            {commonGenres.slice(1).map((genre) => (
              <option key={genre} value={genre}>
                {genre}
              </option>
            ))}
          </select>
          <button
            onClick={handleSearch}
            disabled={isLoading}
            className="search-button"
          >
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {message && <div className={`message ${message.type}`}>{message.text}</div>}

      {selectedSong && (
        <div className="add-song-dialog">
          <h3>Add "{selectedSong.title}" to Playlist</h3>
          <div className="dialog-content">
            <div className="add-options">
              {playlists.length > 0 && (
                <>
                  <label>
                    <input
                      type="radio"
                      name="add-option"
                      checked={!selectedPlaylistId}
                      onChange={() => setSelectedPlaylistId('')}
                    />
                    Add to first available playlist
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="add-option"
                      checked={!!selectedPlaylistId}
                      onChange={() => {
                        if (playlists.length > 0) {
                          setSelectedPlaylistId(playlists[0]!.id);
                        }
                      }}
                    />
                    Choose a playlist:
                  </label>
                </>
              )}
              {selectedPlaylistId && (
                <select
                  value={selectedPlaylistId}
                  onChange={(e) => setSelectedPlaylistId(e.target.value)}
                  className="playlist-select"
                >
                  {playlists.map((playlist) => (
                    <option key={playlist.id} value={playlist.id}>
                      {playlist.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="dialog-actions">
              <button onClick={handleCancelAdd} className="cancel-button">
                Cancel
              </button>
              <button onClick={handleConfirmAdd} className="confirm-button">
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div className="search-results">
          <h3>Results ({results.length})</h3>
          <div className="results-list">
            {results.map((song) => (
              <div key={song.id} className="result-item">
                <div className="song-info">
                  <div className="song-title">{song.title}</div>
                  <div className="song-details">
                    <span className="song-artist">{song.artist}</span>
                    {song.genre && (
                      <>
                        <span className="song-separator">•</span>
                        <span className="song-genre">{song.genre}</span>
                      </>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleAddSongClick(song)}
                  className="add-button"
                >
                  Add to Playlist
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
