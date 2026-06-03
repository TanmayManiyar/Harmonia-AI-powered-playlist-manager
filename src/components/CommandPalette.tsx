import React, { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Plus, Store, Search, Sparkles, Library, Heart, Disc3, SunMoon, Play,
} from 'lucide-react';
import { ViewId, ActionId } from './Sidebar';
import { usePlaylistStore } from '../store';
import { usePlayerStore } from '../store/playerStore';
import { useThemeStore } from '../store/themeStore';

interface CommandPaletteProps {
  onSelectView: (view: ViewId) => void;
  onOpenAction: (action: ActionId) => void;
}

/**
 * CommandPalette — ⌘K / Ctrl-K to jump to views, run actions, toggle theme,
 * or play any playlist.
 */
export const CommandPalette: React.FC<CommandPaletteProps> = ({ onSelectView, onOpenAction }) => {
  const [open, setOpen] = useState(false);

  const playlists = usePlaylistStore((s) => s.getAllPlaylists());
  const playQueue = usePlayerStore((s) => s.playQueue);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const run = (fn: () => void) => {
    setOpen(false);
    fn();
  };

  const itemClass =
    'flex cursor-pointer items-center gap-3 rounded px-3 py-2.5 text-sm text-ink-soft aria-selected:bg-paper-2 aria-selected:text-ink';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[120] flex items-start justify-center px-4 pt-[12vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={() => setOpen(false)}
        >
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]" />
          <motion.div
            className="relative w-full max-w-lg overflow-hidden rounded-lg border border-line bg-surface shadow-[var(--shadow-lg)]"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <Command className="flex flex-col" loop>
              <Command.Input
                placeholder="Search playlists, jump to a view, run an action…"
                className="w-full border-b border-line bg-transparent px-4 py-3.5 text-sm text-ink outline-none placeholder:text-muted"
              />
              <Command.List className="max-h-[340px] overflow-y-auto p-2">
                <Command.Empty className="px-3 py-6 text-center text-sm text-muted">
                  No results found.
                </Command.Empty>

                <Command.Group heading="Actions" className="px-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[0.66rem] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.14em] [&_[cmdk-group-heading]]:text-muted">
                  <Command.Item className={itemClass} onSelect={() => run(() => onOpenAction('create'))}>
                    <Plus size={16} className="text-muted" /> Create playlist
                  </Command.Item>
                  <Command.Item className={itemClass} onSelect={() => run(() => onOpenAction('venues'))}>
                    <Store size={16} className="text-muted" /> Venue playlists
                  </Command.Item>
                  <Command.Item className={itemClass} onSelect={() => run(() => onOpenAction('search'))}>
                    <Search size={16} className="text-muted" /> Search songs
                  </Command.Item>
                  <Command.Item className={itemClass} onSelect={() => run(() => onOpenAction('ai'))}>
                    <Sparkles size={16} className="text-muted" /> AI chat
                  </Command.Item>
                  <Command.Item className={itemClass} onSelect={() => run(toggleTheme)}>
                    <SunMoon size={16} className="text-muted" /> Toggle theme
                  </Command.Item>
                </Command.Group>

                <Command.Group heading="Go to" className="mt-1 px-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[0.66rem] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.14em] [&_[cmdk-group-heading]]:text-muted">
                  <Command.Item className={itemClass} onSelect={() => run(() => onSelectView('library'))}>
                    <Library size={16} className="text-muted" /> Library
                  </Command.Item>
                  <Command.Item className={itemClass} onSelect={() => run(() => onSelectView('favorites'))}>
                    <Heart size={16} className="text-muted" /> Favorites
                  </Command.Item>
                  <Command.Item className={itemClass} onSelect={() => run(() => onSelectView('genres'))}>
                    <Disc3 size={16} className="text-muted" /> Genres
                  </Command.Item>
                </Command.Group>

                {playlists.length > 0 && (
                  <Command.Group heading="Play a playlist" className="mt-1 px-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[0.66rem] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.14em] [&_[cmdk-group-heading]]:text-muted">
                    {playlists.map((p) => (
                      <Command.Item
                        key={p.id}
                        value={`play ${p.name} ${p.genre}`}
                        className={itemClass}
                        onSelect={() => run(() => playQueue(p.songs, 0))}
                      >
                        <Play size={16} className="text-muted" />
                        <span className="truncate">{p.name}</span>
                        <span className="ml-auto text-xs text-muted">{p.genre}</span>
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}
              </Command.List>
            </Command>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
