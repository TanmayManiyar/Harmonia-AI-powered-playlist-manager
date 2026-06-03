import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';

/**
 * ThemeToggle — a small editorial pill fixed to the bottom-right corner.
 * One tap flips between the paper (light) and ink (dark) themes.
 */
export const ThemeToggle: React.FC = () => {
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Light mode' : 'Dark mode'}
      className="fixed bottom-5 right-5 z-[60] grid h-11 w-11 place-items-center rounded-full border border-line-strong bg-surface text-ink shadow-[var(--shadow)] transition-all duration-200 hover:bg-paper-2 hover:-translate-y-0.5 active:translate-y-0"
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
};
