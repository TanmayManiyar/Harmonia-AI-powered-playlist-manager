import React, { useState } from 'react';
import { usePlaylistStore } from '../store';
import './components.css';

interface AddCustomSongDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * AddCustomSongDialog component - Interface for adding custom songs
 */
export const AddCustomSongDialog: React.FC<AddCustomSongDialogProps> = ({
  isOpen,
  onClose,
}) => {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [genre, setGenre] = useState('');
  const [language, setLanguage] = useState('');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const addSongToPlaylist = usePlaylistStore((state) => state.addSongToPlaylist);
  const playlists = usePlaylistStore((state) => state.getAllPlaylists());

  const handleAdd = async () => {
    setErrors([]);
    setMessage(null);

    const validationErrors: string[] = [];
    if (!title.trim()) validationErrors.push('Song title is required');
    if (!artist.trim()) validationErrors.push('Artist name is required');
    if (!selectedPlaylistId) validationErrors.push('Please select a playlist');

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    const customSong = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      title: title.trim(),
      artist: artist.trim(),
      genre: genre.trim() || 'Unknown',
      language: language.trim(),
      isCustom: true,
    };

    try {
      await addSongToPlaylist(selectedPlaylistId, customSong);
      setMessage({ type: 'success', text: `Added "${customSong.title}" to playlist` });
      setTitle('');
      setArtist('');
      setGenre('');
      setLanguage('');
      setSelectedPlaylistId('');
      setTimeout(() => {
        onClose();
        setMessage(null);
      }, 1500);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to add song' });
    }
  };

  const handleCancel = () => {
    setTitle('');
    setArtist('');
    setGenre('');
    setLanguage('');
    setSelectedPlaylistId('');
    setErrors([]);
    setMessage(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="dialog-overlay" onClick={handleCancel}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <h2>Add Custom Song</h2>

        <div className="custom-song-form">
          <div className="form-group">
            <label htmlFor="song-title">Title *</label>
            <input
              id="song-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter song title"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="song-artist">Artist *</label>
            <input
              id="song-artist"
              type="text"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="Enter artist name"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="song-genre">Genre</label>
            <input
              id="song-genre"
              type="text"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              placeholder="Enter genre (optional)"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="song-language">Language</label>
            <input
              id="song-language"
              type="text"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              placeholder="Enter language (optional)"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="playlist-select">Add to Playlist *</label>
            <select
              id="playlist-select"
              value={selectedPlaylistId}
              onChange={(e) => setSelectedPlaylistId(e.target.value)}
              className="genre-filter"
            >
              <option value="">Select a playlist</option>
              {playlists.map((playlist) => (
                <option key={playlist.id} value={playlist.id}>
                  {playlist.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {errors.length > 0 && (
          <div className="validation-errors">
            {errors.map((error, index) => (
              <div key={index} className="error-message">{error}</div>
            ))}
          </div>
        )}

        {message && (
          <div className={`message ${message.type}`}>{message.text}</div>
        )}

        <div className="dialog-actions">
          <button onClick={handleCancel} className="cancel-button">Cancel</button>
          <button onClick={handleAdd} className="confirm-button">Add Song</button>
        </div>
      </div>
    </div>
  );
};
