import { create } from 'zustand';
import { Song } from '../models';

/** A song is playable in-app only if we have a YouTube video id for it. */
export const isPlayable = (song: Song): boolean => Boolean(song.youtubeId);

interface PlayerState {
  queue: Song[];
  index: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number; // 0..100
  expanded: boolean; // now-playing side panel open
  /** Host watches this; when set it seeks the player then clears it. */
  seekTarget: number | null;

  current: () => Song | null;

  playQueue: (songs: Song[], startIndex?: number) => number; // returns # queued
  addToQueue: (songs: Song[]) => number; // returns # added
  clearUpNext: () => void;
  reorderQueue: (from: number, to: number) => void;
  playAt: (index: number) => void;
  toggle: () => void;
  play: () => void;
  pause: () => void;
  next: () => void;
  prev: () => void;
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

  current: () => {
    const { queue, index } = get();
    return queue[index] ?? null;
  },

  playQueue: (songs, startIndex = 0) => {
    const playable = songs.filter(isPlayable);
    if (playable.length === 0) return 0;
    // Map the requested start to the filtered list
    const requested = songs[startIndex];
    let idx = 0;
    if (requested && isPlayable(requested)) {
      idx = playable.findIndex((s) => s.id === requested.id);
      if (idx < 0) idx = 0;
    }
    set({ queue: playable, index: idx, isPlaying: true, currentTime: 0, duration: 0 });
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
    // Keep `index` pointing at the song that's actually playing
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
    const { index, queue } = get();
    if (index + 1 < queue.length) {
      set({ index: index + 1, isPlaying: true, currentTime: 0, duration: 0 });
    } else {
      set({ isPlaying: false });
    }
  },

  prev: () => {
    const { index, currentTime } = get();
    // Restart current track if we're more than 3s in, else go back one
    if (currentTime > 3 || index === 0) {
      set({ seekTarget: 0, currentTime: 0 });
    } else {
      set({ index: index - 1, isPlaying: true, currentTime: 0, duration: 0 });
    }
  },

  requestSeek: (t) => set({ seekTarget: t, currentTime: t }),
  clearSeek: () => set({ seekTarget: null }),

  setVolume: (v) => set({ volume: Math.max(0, Math.min(100, v)) }),
  setProgress: (currentTime, duration) => set({ currentTime, duration }),

  setExpanded: (b) => set({ expanded: b }),
  toggleExpanded: () => set((s) => ({ expanded: !s.expanded })),

  clear: () => set({ queue: [], index: 0, isPlaying: false, currentTime: 0, duration: 0, expanded: false }),
}));
