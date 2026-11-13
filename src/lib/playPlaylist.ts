import { usePlayerStore } from '../store/playerStore';
import { usePlaylistStore } from '../store';
import { api } from '../services/api';
import { recordRecentlyPlayed } from './recentlyPlayed';
import type { Song } from '../models';

interface PlayablePlaylist {
  id: string;
  name: string;
  genre: string;
  songs: Song[];
}

/** Queue a playlist, record it under "On Repeat", and bump its play count. Returns songs queued. */
export function playPlaylist(p: PlayablePlaylist): number {
  const queued = usePlayerStore.getState().playQueue(p.songs, 0, p.id || null);
  if (queued > 0 && p.id) {
    // Playing the just-created playlist retires the "fresh" banner.
    const lib = usePlaylistStore.getState();
    if (lib.lastCreatedId === p.id) lib.clearCreated();
    recordRecentlyPlayed({ id: p.id, name: p.name, genre: p.genre, songs: p.songs });
    api.markPlayed(p.id);
  }
  return queued;
}
