import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './ui/button';
import { cn } from '../lib/utils';

const GENRES = [
  'Pop', 'Hip-Hop', 'R&B', 'Rock', 'EDM', 'Indie', 'Lo-Fi', 'K-Pop',
  'Jazz', 'Bollywood', 'Metal', 'Classical', 'Latin', 'Afrobeats', 'Country', 'Punjabi',
];

export const ONBOARDED_KEY = 'playlist-manager:onboarded';
export const GENRES_KEY = 'playlist-manager:genres';

interface OnboardingModalProps {
  isOpen: boolean;
  onDone: (genres: string[]) => void;
}

/**
 * OnboardingModal — first-run welcome that captures favorite genres to
 * personalize recommendations. Shown once (tracked in localStorage).
 */
export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onDone }) => {
  const [picked, setPicked] = useState<string[]>([]);

  const toggle = (g: string) =>
    setPicked((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));

  const finish = () => {
    try {
      localStorage.setItem(ONBOARDED_KEY, '1');
      localStorage.setItem(GENRES_KEY, JSON.stringify(picked));
    } catch {
      /* ignore */
    }
    onDone(picked);
  };

  return (
    <Modal isOpen={isOpen} onClose={finish} title="welcome to harmonia 🎉" size="lg">
      <p className="mb-5 text-sm text-muted">
        what are you into? pick a few — we'll tune your recs to match. (you can skip.)
      </p>
      <div className="flex flex-wrap gap-2.5">
        {GENRES.map((g) => {
          const on = picked.includes(g);
          return (
            <button
              key={g}
              onClick={() => toggle(g)}
              className={cn(
                'rounded-full border-2 px-4 py-2 text-sm font-semibold transition-all active:scale-95',
                on
                  ? 'border-accent bg-accent/10 text-accent-ink'
                  : 'border-line text-ink-soft hover:border-line-strong hover:text-ink'
              )}
            >
              {g}
            </button>
          );
        })}
      </div>
      <div className="mt-7 flex items-center justify-between">
        <span className="text-xs text-muted">{picked.length} selected</span>
        <Button variant="accent" size="lg" onClick={finish}>
          {picked.length > 0 ? "let's go 🚀" : 'skip for now'}
        </Button>
      </div>
    </Modal>
  );
};
