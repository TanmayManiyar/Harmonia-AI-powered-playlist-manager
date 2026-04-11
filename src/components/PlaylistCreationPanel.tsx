import React, { useState } from 'react';
import { usePlaylistStore } from '../store';
import { api } from '../services/api';
import './components.css';

/**
 * PlaylistCreationPanel component - Interface for creating genre-based playlists
 * Supports multiple language selection with even song distribution
 */
export const PlaylistCreationPanel: React.FC = () => {
  const [genre, setGenre] = useState('');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['English']);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const [isCreating, setIsCreating] = useState(false);

  const fetchPlaylists = usePlaylistStore((state) => state.fetchPlaylists);

  const commonGenres = ['Rock', 'Pop', 'Jazz', 'Classical', 'Hip Hop', 'Electronic', 'Country', 'Bollywood', 'Metal', 'R&B', 'Latin'];

  const availableLanguages = ['English', 'Hindi', 'Spanish', 'French', 'Korean', 'Japanese', 'Mandarin', 'Portuguese', 'German', 'Italian'];

  const toggleLanguage = (lang: string) => {
    setSelectedLanguages((prev) => {
      if (prev.includes(lang)) {
        if (prev.length === 1) return prev; // keep at least one
        return prev.filter((l) => l !== lang);
      }
      return [...prev, lang];
    });
  };

  const handleCreatePlaylist = async () => {
    setMessage(null);

    const trimmedGenre = genre.trim();
    if (!trimmedGenre) {
      setMessage({ type: 'error', text: 'Please enter a genre' });
      return;
    }

    if (selectedLanguages.length === 0) {
      setMessage({ type: 'error', text: 'Please select at least one language' });
      return;
    }

    setIsCreating(true);

    try {
      const prompt = `Create a ${trimmedGenre} playlist. Include exactly 10 songs. Ensure the songs are distributed across these languages: ${selectedLanguages.join(', ')}.`;
      
      // Create and populate the playlist completely via the Gemini backend
      const newPlaylist = await api.chatWithAI(prompt, undefined, trimmedGenre);
      
      // Refresh the local Zustand store so the new playlist appears
      await fetchPlaylists();

      const langLabel = selectedLanguages.join(', ');
      setMessage({
        type: 'success',
        text: `Playlist "${newPlaylist.name}" created with ${newPlaylist.songs?.length || 0} songs (${langLabel}) via AI!`,
      });

      setGenre('');
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to create playlist' });
    } finally {
      setIsCreating(false);
    }
  };

  const handleGenreSelect = (selectedGenre: string) => {
    setGenre(selectedGenre);
    setMessage(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreatePlaylist();
    }
  };

  return (
    <div className="playlist-creation-panel">
      <h2>Create Playlist</h2>

      <div className="genre-selection">
        <div className="genre-input-group">
          <input
            type="text"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter genre or select below"
            className="genre-input"
          />
          <button onClick={handleCreatePlaylist} className="create-button" disabled={isCreating}>
            {isCreating ? 'Creating...' : 'Create'}
          </button>
        </div>

        <div className="common-genres">
          <span className="genres-label">Genre:</span>
          {commonGenres.map((g) => (
            <button
              key={g}
              onClick={() => handleGenreSelect(g)}
              className={`genre-chip ${genre === g ? 'selected' : ''}`}
            >
              {g}
            </button>
          ))}
        </div>

        <div className="language-chips">
          <span className="genres-label">Languages:</span>
          {availableLanguages.map((lang) => (
            <button
              key={lang}
              onClick={() => toggleLanguage(lang)}
              className={`language-chip ${selectedLanguages.includes(lang) ? 'selected' : ''}`}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>

      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}
    </div>
  );
};
