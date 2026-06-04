import React, { useState } from 'react';
import {
  Coffee, UtensilsCrossed, Wine, Dumbbell, BedDouble, Briefcase, Flower2,
  Scissors, ShoppingBag, Dice5, HeartPulse, PartyPopper, Shirt, ShoppingCart,
  Sparkles, Check, Loader2,
} from 'lucide-react';
import { usePlaylistStore } from '../store';
import { api } from '../services/api';
import { burstConfetti } from '../lib/confetti';
import { cn } from '../lib/utils';

interface Venue {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const VENUES: Venue[] = [
  { id: 'cafe', label: 'Cafe', icon: <Coffee size={22} /> },
  { id: 'coffee-shop', label: 'Coffee Shop', icon: <Coffee size={22} /> },
  { id: 'restaurant', label: 'Restaurant', icon: <UtensilsCrossed size={22} /> },
  { id: 'bar', label: 'Bar & Pub', icon: <Wine size={22} /> },
  { id: 'gym', label: 'Gym', icon: <Dumbbell size={22} /> },
  { id: 'hotel', label: 'Hotel', icon: <BedDouble size={22} /> },
  { id: 'office', label: 'Office', icon: <Briefcase size={22} /> },
  { id: 'spa', label: 'Spa', icon: <Flower2 size={22} /> },
  { id: 'salon', label: 'Salon', icon: <Scissors size={22} /> },
  { id: 'store', label: 'Store', icon: <ShoppingBag size={22} /> },
  { id: 'casino', label: 'Casino', icon: <Dice5 size={22} /> },
  { id: 'healthcare', label: 'Healthcare', icon: <HeartPulse size={22} /> },
  { id: 'events', label: 'Events', icon: <PartyPopper size={22} /> },
  { id: 'fashion', label: 'Fashion', icon: <Shirt size={22} /> },
  { id: 'supermarket', label: 'Supermarket', icon: <ShoppingCart size={22} /> },
  { id: 'other', label: 'Anything', icon: <Sparkles size={22} /> },
];

type TileState = 'idle' | 'loading' | 'done' | 'error';

/**
 * VenuesPanel — one tap on a venue generates a vibe-matched playlist.
 */
export const VenuesPanel: React.FC = () => {
  const [states, setStates] = useState<Record<string, TileState>>({});
  const fetchPlaylists = usePlaylistStore((s) => s.fetchPlaylists);

  const setState = (id: string, st: TileState) => setStates((prev) => ({ ...prev, [id]: st }));

  const handleTap = async (venue: Venue) => {
    if (states[venue.id] === 'loading') return;
    setState(venue.id, 'loading');
    try {
      await api.createVenuePlaylist(venue.id);
      await fetchPlaylists();
      setState(venue.id, 'done');
      burstConfetti();
      setTimeout(() => setState(venue.id, 'idle'), 2500);
    } catch {
      setState(venue.id, 'error');
      setTimeout(() => setState(venue.id, 'idle'), 3000);
    }
  };

  return (
    <div>
      <p className="mb-4 text-sm text-muted">
        Tap a space and Harmonia instantly builds a playlist tuned to its vibe.
      </p>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
        {VENUES.map((venue) => {
          const st = states[venue.id] ?? 'idle';
          return (
            <button
              key={venue.id}
              onClick={() => handleTap(venue)}
              disabled={st === 'loading'}
              className={cn(
                'flex flex-col items-center justify-center gap-2 rounded-md border px-3 py-5 text-center transition-all',
                st === 'done'
                  ? 'border-accent/50 bg-accent/10 text-accent-ink'
                  : st === 'error'
                    ? 'border-danger/50 text-danger'
                    : 'border-line bg-surface text-ink-soft hover:-translate-y-0.5 hover:border-line-strong hover:text-ink hover:shadow-[var(--shadow)]'
              )}
            >
              <span className={cn(st === 'idle' && 'text-accent-ink')}>
                {st === 'loading' ? (
                  <Loader2 size={22} className="animate-spin" />
                ) : st === 'done' ? (
                  <Check size={22} />
                ) : (
                  venue.icon
                )}
              </span>
              <span className="text-xs font-medium">
                {st === 'done' ? 'Created!' : venue.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
