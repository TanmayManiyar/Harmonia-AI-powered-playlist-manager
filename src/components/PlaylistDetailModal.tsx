import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MonitorPlay, Play, Pencil, Heart, Trash2, Check, Loader2, ListPlus, GripVertical, Share2 } from 'lucide-react';
import { Playlist } from '../models';
import { usePlaylistStore } from '../store';
import { usePlayerStore, isPlayable } from '../store/playerStore';
import { api } from '../services/api';
import { SongItem } from './SongItem';
import { Modal } from './Modal';
import { ConfirmationDialog } from './ConfirmationDialog';
import { PlaylistCover } from './PlaylistCover';
import { Button } from './ui/button';
import { recordRecentlyPlayed } from '../lib/recentlyPlayed';
import { cn } from '../lib/utils';

interface PlaylistDetailModalProps {
  playlist: Playlist | null;
  isOpen: boolean;
  onClose: () => void;
}

type SyncState = 'idle' | 'syncing' | 'success' | 'error';

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

  const toggleFavorite = usePlaylistStore((s) => s.toggleFavorite);
  const updatePlaylistName = usePlaylistStore((s) => s.updatePlaylistName);
  const deletePlaylist = usePlaylistStore((s) => s.deletePlaylist);
  const removeSongFromPlaylist = usePlaylistStore((s) => s.removeSongFromPlaylist);
  const reorderSongs = usePlaylistStore((s) => s.reorderSongs);
  const toggleLike = usePlaylistStore((s) => s.toggleLike);
  const likedPlaylist = usePlaylistStore((s) =>
    Array.from(s.playlists.values()).find((p) => p.name === 'Liked Songs') ?? null
  );

  const playQueue = usePlayerStore((s) => s.playQueue);
  const addToQueue = usePlayerStore((s) => s.addToQueue);
  const playingSongId = usePlayerStore((s) => s.queue[s.index]?.id ?? null);

  const dragIndex = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const likedIds = useMemo(() => new Set(likedPlaylist?.songs.map((s) => s.id) ?? []), [likedPlaylist]);

  useEffect(() => {
    if (playlist) setEditedName(playlist.name);
    setIsEditing(false);
    setSyncStatus('idle');
    setSyncMessage('');
  }, [playlist]);

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
    if (trimmed && trimmed !== playlist.name) updatePlaylistName(playlist.id, trimmed);
    setIsEditing(false);
  };

  const handleConfirmDelete = () => {
    deletePlaylist(playlist.id);
    setShowDeleteDialog(false);
    onClose();
  };

  const flash = (status: SyncState, message: string) => {
    setSyncStatus(status);
    setSyncMessage(message);
    setTimeout(() => {
      setSyncStatus('idle');
      setSyncMessage('');
    }, 5000);
  };

  const handleSyncToYouTube = async () => {
    if (!ytConnected) {
      try {
        await api.startYouTubeOAuth();
      } catch (error: any) {
        flash('error', error.message || 'Failed to start YouTube authorization');
      }
      return;
    }
    setSyncStatus('syncing');
    setSyncMessage('Creating YouTube playlist...');
    try {
      const result = await api.syncPlaylistToYouTube(playlist.id);
      flash('success', `Synced! ${result.addedCount} songs added to YouTube.`);
      if (result.youtubePlaylistUrl) window.open(result.youtubePlaylistUrl, '_blank');
    } catch (error: any) {
      if (error.message?.includes('expired') || error.message?.includes('reconnect')) {
        setYtConnected(false);
        flash('error', 'YouTube connection expired. Click to reconnect.');
      } else {
        flash('error', error.message || 'Sync failed');
      }
    }
  };

  const playableCount = playlist.songs.filter(isPlayable).length;

  const recordPlayed = () => {
    recordRecentlyPlayed({
      id: playlist.id,
      name: playlist.name,
      genre: playlist.genre,
      songs: playlist.songs,
    });
    api.markPlayed(playlist.id);
  };

  const handlePlayAll = () => {
    const queued = playQueue(playlist.songs, 0, playlist.id);
    if (queued === 0) flash('error', 'No playable tracks in this playlist yet.');
    else recordPlayed();
  };

  const handlePlaySong = (songId: string) => {
    const idx = playlist.songs.findIndex((s) => s.id === songId);
    if (idx >= 0) {
      playQueue(playlist.songs, idx, playlist.id);
      recordPlayed();
    }
  };

  const handleQueueAll = () => {
    const added = addToQueue(playlist.songs);
    if (added === 0) flash('error', 'No playable tracks to queue.');
  };

  const handleDrop = (target: number) => {
    const from = dragIndex.current;
    dragIndex.current = null;
    setDragOver(null);
    if (from == null || from === target) return;
    reorderSongs(playlist.id, from, target);
  };

  const handleShare = async () => {
    try {
      const { shareId } = await api.createShareLink(playlist.id);
      const url = `${window.location.origin}/p/${shareId}`;
      try {
        await navigator.clipboard.writeText(url);
        flash('success', 'Share link copied to clipboard');
      } catch {
        flash('success', url);
      }
    } catch (error: any) {
      flash('error', error.message || 'Failed to create share link');
    }
  };

  const languages = [...new Set(playlist.songs.map((s) => s.language).filter(Boolean))].join(', ');

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <div className="mb-5 flex items-start gap-4">
          <PlaylistCover
            name={playlist.name}
            genre={playlist.genre}
            variant="thumb"
            className="h-20 w-20 flex-shrink-0 rounded-md"
          />
          <div className="min-w-0 flex-1">
            {isEditing ? (
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <input
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                  className="min-w-48 flex-1 rounded border border-line-strong bg-surface px-3 py-1.5 font-display text-lg font-semibold text-ink focus:border-accent focus:outline-none"
                />
                <Button size="sm" variant="accent" onClick={handleSaveEdit}>Save</Button>
                <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
              </div>
            ) : (
              <h2 className="mb-1.5 break-words font-display text-2xl font-semibold leading-tight text-ink">
                {playlist.name}
              </h2>
            )}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
              <span className="rounded-full border border-line bg-paper-2 px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide text-ink-soft">
                {playlist.genre}
              </span>
              <span>{playlist.songs.length} songs</span>
              {languages && <span>· {languages}</span>}
            </div>
          </div>
        </div>

        <div className="mb-5 flex flex-wrap gap-2 border-b border-line pb-5">
          <Button variant="accent" onClick={handlePlayAll} disabled={playableCount === 0}>
            <Play size={16} /> Play all
          </Button>
          <Button variant="outline" onClick={handleQueueAll} disabled={playableCount === 0}>
            <ListPlus size={16} /> Queue
          </Button>
          <Button
            variant="outline"
            onClick={handleSyncToYouTube}
            disabled={syncStatus === 'syncing'}
          >
            {syncStatus === 'syncing' ? (
              <Loader2 size={16} className="animate-spin" />
            ) : syncStatus === 'success' ? (
              <Check size={16} />
            ) : (
              <MonitorPlay size={16} />
            )}
            {syncStatus === 'syncing'
              ? 'Syncing...'
              : syncStatus === 'success'
                ? 'Synced!'
                : ytConnected
                  ? 'Sync to YouTube'
                  : 'Connect YouTube'}
          </Button>
          <Button variant="ghost" onClick={handleShare}>
            <Share2 size={16} /> Share
          </Button>
          <Button variant="ghost" onClick={() => setIsEditing(true)}>
            <Pencil size={16} /> Rename
          </Button>
          <Button
            variant="ghost"
            onClick={() => toggleFavorite(playlist.id)}
            className={playlist.isFavorite ? 'text-accent-ink' : ''}
          >
            <Heart size={16} fill={playlist.isFavorite ? 'currentColor' : 'none'} />
            {playlist.isFavorite ? 'Favorited' : 'Favorite'}
          </Button>
          <Button variant="danger" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 size={16} /> Delete
          </Button>
        </div>

        {syncMessage && (
          <div
            className={
              'mb-4 rounded border px-3 py-2 text-sm ' +
              (syncStatus === 'error'
                ? 'border-danger/40 text-danger'
                : syncStatus === 'success'
                  ? 'border-accent/40 text-accent-ink'
                  : 'border-line text-ink-soft')
            }
          >
            {syncMessage}
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          {playlist.songs.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">No songs in this playlist yet.</p>
          ) : (
            playlist.songs.map((song, i) => (
              <div
                key={song.id}
                draggable
                onDragStart={() => { dragIndex.current = i; }}
                onDragEnd={() => { dragIndex.current = null; setDragOver(null); }}
                onDragOver={(e) => { e.preventDefault(); if (dragOver !== i) setDragOver(i); }}
                onDrop={() => handleDrop(i)}
                className={cn('flex items-center gap-1 rounded', dragOver === i && 'bg-paper-2 ring-1 ring-accent/30')}
              >
                <span className="cursor-grab px-1 text-muted active:cursor-grabbing" aria-hidden="true">
                  <GripVertical size={15} />
                </span>
                <div className="min-w-0 flex-1">
                  <SongItem
                    song={song}
                    isActive={song.id === playingSongId}
                    liked={likedIds.has(song.id)}
                    onLike={toggleLike}
                    onPlay={() => handlePlaySong(song.id)}
                    onRemove={(songId) => removeSongFromPlaylist(playlist.id, songId)}
                  />
                </div>
              </div>
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
