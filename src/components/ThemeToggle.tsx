import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';
import { usePlayerStore } from '../store/playerStore';
import { cn } from '../lib/utils';

/**
 * ThemeToggle — small editorial pill in the bottom-right corner. Lifts above
 * the player bar when something is playing.
 */
export const ThemeToggle: React.FC = () => {
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const hasTrack = usePlayerStore((s) => s.queue.length > 0);
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Light mode' : 'Dark mode'}
      className={cn(
        'fixed right-5 z-[71] grid h-11 w-11 place-items-center rounded-full border border-line-strong bg-surface text-ink shadow-[var(--shadow)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-paper-2 active:translate-y-0',
        hasTrack ? 'bottom-[5.25rem]' : 'bottom-5'
      )}
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
};
