import React, { useState } from 'react';
import { Loader2, Check } from 'lucide-react';
import { usePlaylistStore } from '../store';
import { api } from '../services/api';
import { CATEGORY_GROUPS, CategoryGroup, Category } from '../lib/categories';

const COLOR_SETS = [
  { bg: 'var(--grape)', fg: '#ffffff' },
  { bg: 'var(--bubble)', fg: '#ffffff' },
  { bg: 'var(--ice)', fg: '#0c1418' },
  { bg: 'var(--acid)', fg: '#15121c' },
  { bg: '#FF7A3D', fg: '#1a0e08' },
  { bg: '#A78BFA', fg: '#1a1030' },
];

type TileState = 'idle' | 'loading' | 'done' | 'error';

interface BrowseGridProps {
  groups?: CategoryGroup[];
  /** Show only the first N tiles of each group (compact / home). */
  limitPerGroup?: number;
  onAfterCreate?: () => void;
}

/**
 * BrowseGrid — Spotify-style category tiles. Tapping a tile spins up a
 * vibe-matched playlist via Gemini and drops it in the library.
 */
export const BrowseGrid: React.FC<BrowseGridProps> = ({
  groups = CATEGORY_GROUPS,
  limitPerGroup,
  onAfterCreate,
}) => {
  const [states, setStates] = useState<Record<string, TileState>>({});
  const fetchPlaylists = usePlaylistStore((s) => s.fetchPlaylists);

  const set = (id: string, st: TileState) => setStates((p) => ({ ...p, [id]: st }));

  const tap = async (c: Category) => {
    if (states[c.id] === 'loading') return;
    set(c.id, 'loading');
    try {
      await api.chatWithAI(c.prompt, c.label, c.genre);
      await fetchPlaylists();
      onAfterCreate?.();
      set(c.id, 'done');
      setTimeout(() => set(c.id, 'idle'), 2500);
    } catch {
      set(c.id, 'error');
      setTimeout(() => set(c.id, 'idle'), 3000);
    }
  };

  return (
    <div>
      {groups.map((group) => {
        const items = limitPerGroup ? group.items.slice(0, limitPerGroup) : group.items;
        return (
          <div key={group.title} className="mb-7">
            <h3 className="mb-3 font-display text-base font-bold tracking-tight text-ink">{group.title}</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {items.map((c, i) => {
                const cs = COLOR_SETS[i % COLOR_SETS.length]!;
                const st = states[c.id] ?? 'idle';
                return (
                  <button
                    key={c.id}
                    onClick={() => tap(c)}
                    disabled={st === 'loading'}
                    className="relative h-24 overflow-hidden rounded-2xl border-2 border-ink p-3 text-left shadow-[var(--shadow-pop)] transition-transform hover:-translate-y-1 active:translate-y-0"
                    style={{ background: cs.bg, color: cs.fg }}
                  >
                    <span className="relative z-10 block max-w-[80%] text-sm font-bold leading-tight">{c.label}</span>
                    <span className="pointer-events-none absolute -bottom-2 -right-1 rotate-12 text-4xl opacity-90">{c.emoji}</span>
                    {st === 'loading' && (
                      <span className="absolute inset-0 z-20 grid place-items-center bg-black/25 text-white">
                        <Loader2 size={20} className="animate-spin" />
                      </span>
                    )}
                    {st === 'done' && (
                      <span className="absolute inset-0 z-20 grid place-items-center gap-1 bg-black/30 text-sm font-bold text-white">
                        <Check size={18} /> added!
                      </span>
                    )}
                    {st === 'error' && (
                      <span className="absolute inset-0 z-20 grid place-items-center bg-black/40 text-xs font-bold text-white">
                        try again
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
