import React, { useState, useEffect } from 'react';
import {
  MonitorPlay,
  Play,
  Pencil,
  Heart,
  Trash2,
  Check,
  Loader2,
  Music,
} from 'lucide-react';
import { Playlist } from '../models';
import { usePlaylistStore } from '../store';
import { api } from '../services/api';
import { SongItem } from './SongItem';
import { Modal } from './Modal';
import { ConfirmationDialog } from './ConfirmationDialog';
import './components.css';

interface PlaylistDetailModalProps {
  playlist: Playlist | null;
  isOpen: boolean;
  onClose: () => void;
}

type SyncState = 'idle' | 'syncing' | 'success' | 'error';

/**
 * PlaylistDetailModal — full playlist view in a centered glass modal.
 * Owns rename, favorite, delete, remove-song, YouTube sync, and play-all.
 */
export const PlaylistDetailModal: React.FC<PlaylistDetailModalProps> = ({
  playlist,
  isOpen,
  onClose,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncState>('idle');
  const [syncMessage, setSyncMessage] = useState('');
  const [ytConnected, setYtConnected] = useState<boolean | null>(null);

  const toggleFavorite = usePlaylistStore((state) => state.toggleFavorite);
  const updatePlaylistName = usePlaylistStore((state) => state.updatePlaylistName);
  const deletePlaylist = usePlaylistStore((state) => state.deletePlaylist);
  const removeSongFromPlaylist = usePlaylistStore((state) => state.removeSongFromPlaylist);

  // Reset transient state whenever a different playlist is opened
  useEffect(() => {
    if (playlist) setEditedName(playlist.name);
    setIsEditing(false);
    setSyncStatus('idle');
    setSyncMessage('');
  }, [playlist]);

  // Check YouTube connection status when the modal opens
  useEffect(() => {
    if (!isOpen) return;
    api
      .getYouTubeStatus()
      .then(({ connected }) => setYtConnected(connected))
      .catch(() => setYtConnected(false));
  }, [isOpen]);

  if (!playlist) return null;

  const handleSaveEdit = () => {
    const trimmed = editedName.trim();
    if (trimmed && trimmed !== playlist.name) {
      updatePlaylistName(playlist.id, trimmed);
    }
    setIsEditing(false);
  };

  const handleConfirmDelete = () => {
    deletePlaylist(playlist.id);
    setShowDeleteDialog(false);
    onClose();
  };

  const handleSyncToYouTube = async () => {
    if (!ytConnected) {
      try {
        await api.startYouTubeOAuth();
      } catch (error: any) {
        setSyncStatus('error');
        setSyncMessage(error.message || 'Failed to start YouTube authorization');
        setTimeout(() => {
          setSyncStatus('idle');
          setSyncMessage('');
        }, 5000);
      }
      return;
    }

    setSyncStatus('syncing');
    setSyncMessage('Creating YouTube playlist...');

    try {
      const result = await api.syncPlaylistToYouTube(playlist.id);
      setSyncStatus('success');
      setSyncMessage(`Synced! ${result.addedCount} songs added to YouTube.`);
      if (result.youtubePlaylistUrl) {
        window.open(result.youtubePlaylistUrl, '_blank');
      }
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

  const handlePlayOnYouTube = () => {
    const validVideoIds = playlist.songs.map((song) => song.youtubeId).filter(Boolean);
    if (validVideoIds.length === 0) {
      setSyncMessage('No playable YouTube videos in this playlist.');
      setTimeout(() => setSyncMessage(''), 4000);
      return;
    }
    const limitIds = validVideoIds.slice(0, 50).join(',');
    window.open(`https://www.youtube.com/watch_videos?video_ids=${limitIds}`, '_blank');
  };

  const languages = [...new Set(playlist.songs.map((s) => s.language).filter(Boolean))].join(', ');

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size="lg" className="playlist-modal">
        <div className="pm-header">
          <div className="pm-cover">
            <Music size={32} />
          </div>
          <div className="pm-heading">
            {isEditing ? (
              <div className="pm-edit">
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="pm-name-input"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                />
                <button onClick={handleSaveEdit} className="btn btn--primary btn--sm">
                  Save
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="btn btn--ghost btn--sm"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <h2 className="pm-title">{playlist.name}</h2>
            )}
            <div className="pm-meta">
              <span className="pm-genre-badge">{playlist.genre}</span>
              <span>{playlist.songs.length} songs</span>
              {languages && <span>{languages}</span>}
            </div>
          </div>
        </div>

        <div className="pm-actions">
          <button
            className={`btn btn--yt ${syncStatus}`}
            onClick={handleSyncToYouTube}
            disabled={syncStatus === 'syncing'}
          >
            {syncStatus === 'syncing' ? (
              <Loader2 size={18} className="spin" />
            ) : syncStatus === 'success' ? (
              <Check size={18} />
            ) : (
              <MonitorPlay size={18} />
            )}
            {syncStatus === 'syncing'
              ? 'Syncing...'
              : syncStatus === 'success'
                ? 'Synced!'
                : ytConnected
                  ? 'Sync to YouTube'
                  : 'Connect YouTube'}
          </button>
          <button className="btn btn--primary" onClick={handlePlayOnYouTube}>
            <Play size={18} />
            Play all
          </button>
          <button className="btn btn--ghost" onClick={() => setIsEditing(true)}>
            <Pencil size={18} />
            Rename
          </button>
          <button
            className={`btn btn--ghost ${playlist.isFavorite ? 'is-fav' : ''}`}
            onClick={() => toggleFavorite(playlist.id)}
          >
            <Heart size={18} fill={playlist.isFavorite ? 'currentColor' : 'none'} />
            {playlist.isFavorite ? 'Favorited' : 'Favorite'}
          </button>
          <button
            className="btn btn--ghost btn--danger"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 size={18} />
            Delete
          </button>
        </div>

        {syncMessage && <div className={`pm-sync-msg ${syncStatus}`}>{syncMessage}</div>}

        <div className="pm-songs">
          {playlist.songs.length === 0 ? (
            <p className="empty-message">No songs in this playlist yet.</p>
          ) : (
            playlist.songs.map((song) => (
              <SongItem
                key={song.id}
                song={song}
                onRemove={(songId) => removeSongFromPlaylist(playlist.id, songId)}
              />
            ))
          )}
        </div>
      </Modal>

      <ConfirmationDialog
        isOpen={showDeleteDialog}
        message={`Are you sure you want to delete "${playlist.name}"? This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteDialog(false)}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </>
  );
};
