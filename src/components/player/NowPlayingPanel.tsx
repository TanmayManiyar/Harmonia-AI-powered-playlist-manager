import React, { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Play, Pause, SkipBack, SkipForward, GripVertical } from 'lucide-react';
import { usePlayerStore } from '../../store/playerStore';
import { SongThumb } from '../SongThumb';
import { cn } from '../../lib/utils';

/**
 * NowPlayingPanel — right drawer. Big cover + transport live inside the same
 * scroll area as the queue (so the cover scrolls up as you browse up-next).
 * The queue is drag-reorderable.
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
  const clearUpNext = usePlayerStore((s) => s.clearUpNext);
  const reorderQueue = usePlayerStore((s) => s.reorderQueue);

  const current = queue[index] ?? null;
  const dragIndex = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  const handleDrop = (target: number) => {
    const from = dragIndex.current;
    dragIndex.current = null;
    setDragOver(null);
    if (from == null || from === target) return;
    reorderQueue(from, target);
  };

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
            className="fixed inset-y-0 right-0 z-[78] flex w-full max-w-[380px] flex-col border-l-2 border-line bg-surface"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <span className="text-[0.66rem] font-bold uppercase tracking-[0.14em] text-muted">Now Playing</span>
              <button
                onClick={() => setExpanded(false)}
                aria-label="Close now playing"
                className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-paper-2 hover:text-ink"
              >
                <X size={18} />
              </button>
            </div>

            {/* single scroll area — cover scrolls up with the queue */}
            <div className="flex-1 overflow-y-auto">
              <div className="flex flex-col items-center px-6 pt-8 text-center">
                <SongThumb
                  youtubeId={current.youtubeId}
                  title={current.title}
                  iconSize={56}
                  className="aspect-square w-48 rounded-2xl border-2 border-ink shadow-[var(--shadow-pop)]"
                />
                <h3 className="mt-5 font-display text-xl font-bold text-ink">{current.title}</h3>
                <p className="mt-1 text-sm text-muted">{current.artist}</p>

                <div className="mt-6 flex items-center gap-2">
                  <button onClick={prev} aria-label="Previous" className="grid h-10 w-10 place-items-center rounded-full text-ink-soft hover:bg-paper-2">
                    <SkipBack size={20} />
                  </button>
                  <button
                    onClick={toggle}
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                    className="grid h-12 w-12 place-items-center rounded-full bg-accent text-accent-contrast hover:brightness-110"
                  >
                    {isPlaying ? <Pause size={20} /> : <Play size={20} className="translate-x-px" />}
                  </button>
                  <button onClick={next} aria-label="Next" className="grid h-10 w-10 place-items-center rounded-full text-ink-soft hover:bg-paper-2">
                    <SkipForward size={20} />
                  </button>
                </div>
              </div>

              <div className="mt-8 px-3 pb-4">
                <div className="flex items-center justify-between px-2 pb-2">
                  <span className="text-[0.66rem] font-bold uppercase tracking-[0.14em] text-muted">Up Next · drag to reorder</span>
                  {index < queue.length - 1 && (
                    <button onClick={clearUpNext} className="text-[0.7rem] font-semibold text-muted transition-colors hover:text-danger">
                      Clear
                    </button>
                  )}
                </div>
                <div>
                  {queue.map((song, i) => (
                    <div
                      key={`${song.id}-${i}`}
                      draggable
                      onDragStart={() => { dragIndex.current = i; }}
                      onDragEnd={() => { dragIndex.current = null; setDragOver(null); }}
                      onDragOver={(e) => { e.preventDefault(); if (dragOver !== i) setDragOver(i); }}
                      onDrop={() => handleDrop(i)}
                      className={cn(
                        'flex items-center gap-2 rounded-lg px-1.5 py-1.5 transition-colors',
                        dragOver === i ? 'bg-paper-2 ring-1 ring-accent/40' : i === index ? 'bg-paper-2' : 'hover:bg-paper-2'
                      )}
                    >
                      <span className="cursor-grab text-muted active:cursor-grabbing" aria-hidden="true">
                        <GripVertical size={14} />
                      </span>
                      <button onClick={() => playAt(i)} className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
                        <SongThumb youtubeId={song.youtubeId} title={song.title} iconSize={14} className="h-10 w-10 shrink-0 rounded-md" />
                        <span className="min-w-0">
                          <span className={cn('block truncate text-sm', i === index ? 'font-bold text-accent-ink' : 'font-medium text-ink')}>
                            {song.title}
                          </span>
                          <span className="block truncate text-xs text-muted">{song.artist}</span>
                        </span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
