import { create } from 'zustand';
import { Song } from '../models';

/** Queueable if it has a video id OR enough metadata to resolve one on play. */
export const isPlayable = (song: Song): boolean => Boolean(song.youtubeId || song.title);

export type RepeatMode = 'off' | 'all' | 'one';

interface PlayerState {
  queue: Song[];
  index: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number; // 0..100
  expanded: boolean; // now-playing side panel open
  seekTarget: number | null; // host seeks then clears
  queuePlaylistId: string | null; // source playlist (for lazy-resolve persistence)
  shuffle: boolean;
  repeat: RepeatMode;
  sleepAt: number | null; // epoch ms to auto-pause, or null

  current: () => Song | null;

  playQueue: (songs: Song[], startIndex?: number, playlistId?: string | null) => number;
  addToQueue: (songs: Song[]) => number;
  clearUpNext: () => void;
  reorderQueue: (from: number, to: number) => void;
  playAt: (index: number) => void;
  toggle: () => void;
  play: () => void;
  pause: () => void;
  next: () => void;
  prev: () => void;
  onTrackEnd: () => void;
  resolveCurrent: (youtubeId: string) => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  setSleepTimer: (minutes: number | null) => void;
  requestSeek: (t: number) => void;
  clearSeek: () => void;
  setVolume: (v: number) => void;
  setProgress: (currentTime: number, duration: number) => void;
  setExpanded: (b: boolean) => void;
  toggleExpanded: () => void;
  clear: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  queue: [],
  index: 0,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 80,
  expanded: false,
  seekTarget: null,
  queuePlaylistId: null,
  shuffle: false,
  repeat: 'off',
  sleepAt: null,

  current: () => {
    const { queue, index } = get();
    return queue[index] ?? null;
  },

  playQueue: (songs, startIndex = 0, playlistId = null) => {
    const playable = songs.filter(isPlayable);
    if (playable.length === 0) return 0;
    const requested = songs[startIndex];
    let idx = 0;
    if (requested) {
      const found = playable.findIndex((s) => s.id === requested.id);
      if (found >= 0) idx = found;
    }
    set({ queue: playable, index: idx, isPlaying: true, currentTime: 0, duration: 0, queuePlaylistId: playlistId });
    return playable.length;
  },

  addToQueue: (songs) => {
    const playable = songs.filter(isPlayable);
    if (playable.length === 0) return 0;
    const { queue } = get();
    if (queue.length === 0) {
      set({ queue: playable, index: 0, isPlaying: true, currentTime: 0, duration: 0 });
    } else {
      set({ queue: [...queue, ...playable] });
    }
    return playable.length;
  },

  clearUpNext: () => {
    const { queue, index } = get();
    set({ queue: queue.slice(0, index + 1) });
  },

  reorderQueue: (from, to) => {
    const { queue, index } = get();
    if (from === to || from < 0 || to < 0 || from >= queue.length || to >= queue.length) return;
    const currentId = queue[index]?.id;
    const q = [...queue];
    const [moved] = q.splice(from, 1);
    if (!moved) return;
    q.splice(to, 0, moved);
    const newIndex = currentId ? q.findIndex((s) => s.id === currentId) : index;
    set({ queue: q, index: newIndex < 0 ? index : newIndex });
  },

  playAt: (index) => {
    const { queue } = get();
    if (index < 0 || index >= queue.length) return;
    set({ index, isPlaying: true, currentTime: 0, duration: 0 });
  },

  toggle: () => set((s) => ({ isPlaying: s.queue.length > 0 ? !s.isPlaying : false })),
  play: () => set((s) => (s.queue.length > 0 ? { isPlaying: true } : {})),
  pause: () => set({ isPlaying: false }),

  next: () => {
    const { index, queue, shuffle, repeat } = get();
    if (queue.length === 0) return;
    let nextIndex: number;
    if (shuffle && queue.length > 1) {
      do {
        nextIndex = Math.floor(Math.random() * queue.length);
      } while (nextIndex === index);
    } else {
      nextIndex = index + 1;
    }
    if (nextIndex >= queue.length) {
      if (repeat === 'all') nextIndex = 0;
      else {
        set({ isPlaying: false });
        return;
      }
    }
    set({ index: nextIndex, isPlaying: true, currentTime: 0, duration: 0 });
  },

  prev: () => {
    const { index, currentTime } = get();
    if (currentTime > 3 || index === 0) {
      set({ seekTarget: 0, currentTime: 0 });
    } else {
      set({ index: index - 1, isPlaying: true, currentTime: 0, duration: 0 });
    }
  },

  // Natural end of a track (from the YouTube player)
  onTrackEnd: () => {
    if (get().repeat === 'one') {
      set({ seekTarget: 0, currentTime: 0, isPlaying: true });
    } else {
      get().next();
    }
  },

  resolveCurrent: (youtubeId) =>
    set((s) => {
      const q = [...s.queue];
      const cur = q[s.index];
      if (cur) q[s.index] = { ...cur, youtubeId };
      return { queue: q };
    }),

  toggleShuffle: () => set((s) => ({ shuffle: !s.shuffle })),
  cycleRepeat: () =>
    set((s) => ({ repeat: s.repeat === 'off' ? 'all' : s.repeat === 'all' ? 'one' : 'off' })),

  setSleepTimer: (minutes) => set({ sleepAt: minutes ? Date.now() + minutes * 60000 : null }),

  requestSeek: (t) => set({ seekTarget: t, currentTime: t }),
  clearSeek: () => set({ seekTarget: null }),

  setVolume: (v) => set({ volume: Math.max(0, Math.min(100, v)) }),
  setProgress: (currentTime, duration) => set({ currentTime, duration }),

  setExpanded: (b) => set({ expanded: b }),
  toggleExpanded: () => set((s) => ({ expanded: !s.expanded })),

  clear: () => set({ queue: [], index: 0, isPlaying: false, currentTime: 0, duration: 0, expanded: false, queuePlaylistId: null }),
}));
