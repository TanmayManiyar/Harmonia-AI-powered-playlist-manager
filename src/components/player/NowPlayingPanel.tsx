import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Play, Pause, SkipBack, SkipForward, Music } from 'lucide-react';
import { usePlayerStore } from '../../store/playerStore';
import { cn } from '../../lib/utils';

/**
 * NowPlayingPanel — right-hand drawer with large art, transport, and the
 * up-next queue. Opened by tapping the bottom bar's track.
 */
export const NowPlayingPanel: React.FC = () => {
  const expanded = usePlayerStore((s) => s.expanded);
  const queue = usePlayerStore((s) => s.queue);
  const index = usePlayerStore((s) => s.index);
  const isPlaying = usePlayerStore((s) => s.isPlaying);

  const setExpanded = usePlayerStore((s) => s.setExpanded);
  const toggle = usePlayerStore((s) => s.toggle);
  const next = usePlayerStore((s) => s.next);
  const prev = usePlayerStore((s) => s.prev);
  const playAt = usePlayerStore((s) => s.playAt);

  const current = queue[index] ?? null;

  return (
    <AnimatePresence>
      {expanded && current && (
        <>
          <motion.div
            className="fixed inset-0 z-[75] bg-ink/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setExpanded(false)}
          />
          <motion.aside
            className="fixed inset-y-0 right-0 z-[78] flex w-full max-w-[380px] flex-col border-l border-line bg-surface"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <span className="text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-muted">
                Now Playing
              </span>
              <button
                onClick={() => setExpanded(false)}
                aria-label="Close now playing"
                className="grid h-8 w-8 place-items-center rounded text-muted hover:bg-paper-2 hover:text-ink"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col items-center px-6 pt-8 text-center">
              <div className="grid aspect-square w-48 place-items-center rounded-lg bg-accent/12 text-accent-ink">
                <Music size={56} strokeWidth={1.5} />
              </div>
              <h3 className="mt-5 font-display text-xl font-semibold text-ink">{current.title}</h3>
              <p className="mt-1 text-sm text-muted">{current.artist}</p>

              <div className="mt-6 flex items-center gap-2">
                <button onClick={prev} aria-label="Previous" className="grid h-10 w-10 place-items-center rounded-full text-ink-soft hover:bg-paper-2">
                  <SkipBack size={20} />
                </button>
                <button
                  onClick={toggle}
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                  className="grid h-12 w-12 place-items-center rounded-full bg-accent text-accent-contrast hover:brightness-95"
                >
                  {isPlaying ? <Pause size={20} /> : <Play size={20} className="translate-x-px" />}
                </button>
                <button onClick={next} aria-label="Next" className="grid h-10 w-10 place-items-center rounded-full text-ink-soft hover:bg-paper-2">
                  <SkipForward size={20} />
                </button>
              </div>
            </div>

            <div className="mt-7 flex min-h-0 flex-1 flex-col px-3 pb-4">
              <span className="px-2 pb-2 text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-muted">
                Up Next
              </span>
              <div className="flex-1 overflow-y-auto">
                {queue.map((song, i) => (
                  <button
                    key={`${song.id}-${i}`}
                    onClick={() => playAt(i)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded px-2 py-2 text-left transition-colors',
                      i === index ? 'bg-paper-2' : 'hover:bg-paper-2'
                    )}
                  >
                    <span className="w-5 shrink-0 text-center text-xs tabular-nums text-muted">
                      {i === index && isPlaying ? <Play size={12} className="mx-auto text-accent-ink" /> : i + 1}
                    </span>
                    <span className="min-w-0">
                      <span className={cn('block truncate text-sm', i === index ? 'font-medium text-ink' : 'text-ink-soft')}>
                        {song.title}
                      </span>
                      <span className="block truncate text-xs text-muted">{song.artist}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
