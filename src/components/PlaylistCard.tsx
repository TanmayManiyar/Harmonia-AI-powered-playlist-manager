import React, { useState, useEffect } from 'react';
import { Playlist } from '../models';
import { usePlaylistStore } from '../store';
import { api } from '../services/api';
import { SongItem } from './SongItem';
import { ConfirmationDialog } from './ConfirmationDialog';
import './components.css';

interface PlaylistCardProps {
  playlist: Playlist;
  isExpanded: boolean;
  onToggle: (id: string) => void;
}

/**
 * PlaylistCard component — accordion style with YouTube sync
 */
export const PlaylistCard: React.FC<PlaylistCardProps> = ({ playlist, isExpanded, onToggle }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(playlist.name);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState('');
  const [ytConnected, setYtConnected] = useState<boolean | null>(null);

  const toggleFavorite = usePlaylistStore((state) => state.toggleFavorite);
  const updatePlaylistName = usePlaylistStore((state) => state.updatePlaylistName);
  const deletePlaylist = usePlaylistStore((state) => state.deletePlaylist);
  const removeSongFromPlaylist = usePlaylistStore((state) => state.removeSongFromPlaylist);

  // Check YouTube connection status on mount
  useEffect(() => {
    api.getYouTubeStatus().then(({ connected }) => setYtConnected(connected)).catch(() => setYtConnected(false));
  }, []);

  // Check for OAuth redirect success
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('youtube_connected') === 'true') {
      setYtConnected(true);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleToggleFavorite = () => toggleFavorite(playlist.id);

  const handleStartEdit = () => {
    setIsEditing(true);
    setEditedName(playlist.name);
  };

  const handleSaveEdit = () => {
    const trimmedName = editedName.trim();
    if (trimmedName && trimmedName !== playlist.name) {
      updatePlaylistName(playlist.id, trimmedName);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedName(playlist.name);
  };

  const handleDeleteClick = () => setShowDeleteDialog(true);
  const handleConfirmDelete = () => {
    deletePlaylist(playlist.id);
    setShowDeleteDialog(false);
  };
  const handleCancelDelete = () => setShowDeleteDialog(false);

  const handleRemoveSong = (songId: string) => {
    removeSongFromPlaylist(playlist.id, songId);
  };

  const handleSyncToYouTube = async () => {
    if (!ytConnected) {
      // Start OAuth flow
      api.startYouTubeOAuth();
      return;
    }

    setSyncStatus('syncing');
    setSyncMessage('Creating YouTube playlist...');

    try {
      const result = await api.syncPlaylistToYouTube(playlist.id);
      setSyncStatus('success');
      setSyncMessage(`Synced! ${result.addedCount} songs added to YouTube.`);

      // Open the YouTube playlist in a new tab
      if (result.youtubePlaylistUrl) {
        window.open(result.youtubePlaylistUrl, '_blank');
      }

      // Reset status after 5 seconds
      setTimeout(() => {
        setSyncStatus('idle');
        setSyncMessage('');
      }, 5000);
    } catch (error: any) {
      setSyncStatus('error');
      if (error.message?.includes('expired') || error.message?.includes('reconnect')) {
        setYtConnected(false);
        setSyncMessage('YouTube connection expired. Click to reconnect.');
      } else {
        setSyncMessage(error.message || 'Sync failed');
      }

      setTimeout(() => {
        setSyncStatus('idle');
        setSyncMessage('');
      }, 5000);
    }
  };

  const handlePlayOnYouTube = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Filter out songs that don't have a YouTube ID
    const validVideoIds = playlist.songs
      .map(song => song.youtubeId)
      .filter(Boolean);
      
    if (validVideoIds.length === 0) {
      alert("No valid YouTube videos found in this playlist.");
      return;
    }
    
    // YouTube's watch_videos endpoint supports up to 50 comma-separated IDs
    const limitIds = validVideoIds.slice(0, 50).join(',');
    const playUrl = `https://www.youtube.com/watch_videos?video_ids=${limitIds}`;
    
    window.open(playUrl, '_blank');
  };

  return (
    <div className={`playlist-card ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div className="playlist-header" onClick={() => !isEditing && onToggle(playlist.id)}>
        <div className="playlist-title-section">
          {isEditing ? (
            <div className="playlist-edit" onClick={(e) => e.stopPropagation()}>
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="playlist-name-input"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
              />
              <button onClick={handleSaveEdit} className="save-button">Save</button>
              <button onClick={handleCancelEdit} className="cancel-button">Cancel</button>
            </div>
          ) : (
            <div className="playlist-title">
              <span className={`expand-icon ${isExpanded ? 'open' : ''}`}>▶</span>
              <h3>{playlist.name}</h3>
            </div>
          )}
        </div>

        <div className="playlist-actions" onClick={(e) => e.stopPropagation()}>
          <button
            className={`yt-sync-button ${syncStatus}`}
            onClick={handleSyncToYouTube}
            disabled={syncStatus === 'syncing'}
            title={ytConnected ? 'Sync to YouTube' : 'Connect YouTube & Sync'}
          >
            {syncStatus === 'syncing' ? '⏳' : syncStatus === 'success' ? '✓' : '▶'}
            <span className="yt-sync-label">
              {syncStatus === 'syncing' ? 'Syncing...' : 
               syncStatus === 'success' ? 'Synced!' :
               ytConnected ? 'Sync to YT' : 'Connect YT'}
            </span>
          </button>
          <button
            className="play-button"
            onClick={handlePlayOnYouTube}
            title="Play all on YouTube"
          >
            ▶ Play
          </button>
          <button onClick={handleStartEdit} className="rename-button" title="Rename">✎</button>
          <button
            className={`favorite-button ${playlist.isFavorite ? 'favorited' : ''}`}
            onClick={handleToggleFavorite}
            aria-label={playlist.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            {playlist.isFavorite ? '★' : '☆'}
          </button>
          <button
            className="delete-button"
            onClick={handleDeleteClick}
            aria-label="Delete playlist"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="playlist-info">
        <span className="playlist-genre">Genre: {playlist.genre}</span>
        <span className="playlist-separator">•</span>
        <span className="playlist-song-count">{playlist.songs.length} songs</span>
        {playlist.songs.length > 0 && (
          <>
            <span className="playlist-separator">•</span>
            <span className="playlist-languages">
              {[...new Set(playlist.songs.map(s => s.language).filter(Boolean))].join(', ') || 'English'}
            </span>
          </>
        )}
        {syncMessage && (
          <span className={`sync-status-msg ${syncStatus}`}>{syncMessage}</span>
        )}
      </div>

      {isExpanded && (
        <div className="playlist-songs">
          {playlist.songs.length === 0 ? (
            <p className="empty-message">No songs in this playlist</p>
          ) : (
            playlist.songs.map((song) => (
              <SongItem key={song.id} song={song} onRemove={handleRemoveSong} />
            ))
          )}
        </div>
      )}

      <ConfirmationDialog
        isOpen={showDeleteDialog}
        message={`Are you sure you want to delete "${playlist.name}"? This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
};
