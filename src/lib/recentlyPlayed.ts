import { Song } from '../models';

export interface RecentPlaylist {
  id: string;
  name: string;
  genre: string;
  songs: Song[];
}

const KEY = 'playlist-manager:recent';
const CAP = 12;

export function getRecentlyPlayed(): RecentPlaylist[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Record a played playlist (snapshot), most-recent first, de-duplicated. */
export function recordRecentlyPlayed(p: RecentPlaylist): void {
  if (!p?.id) return;
  try {
    const list = getRecentlyPlayed().filter((x) => x.id !== p.id);
    list.unshift({ id: p.id, name: p.name, genre: p.genre, songs: p.songs ?? [] });
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, CAP)));
    window.dispatchEvent(new Event('harmonia:recent-updated'));
  } catch {
    /* ignore */
  }
}
