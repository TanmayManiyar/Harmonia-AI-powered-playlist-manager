import React from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, ChevronUp, Shuffle, Repeat, Repeat1 } from 'lucide-react';
import { usePlayerStore } from '../../store/playerStore';
import { SongThumb } from '../SongThumb';
import { Equalizer } from './Equalizer';
import { formatTime, cn } from '../../lib/utils';

interface PlayerBarProps {
  /** Offset for the desktop sidebar (home view). */
  inset?: boolean;
}

/**
 * PlayerBar — persistent bottom playback bar. Click the track / chevron to
 * expand the now-playing side panel.
 */
export const PlayerBar: React.FC<PlayerBarProps> = ({ inset = false }) => {
  const current = usePlayerStore((s) => s.queue[s.index] ?? null);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const currentTime = usePlayerStore((s) => s.currentTime);
  const duration = usePlayerStore((s) => s.duration);
  const volume = usePlayerStore((s) => s.volume);

  const shuffle = usePlayerStore((s) => s.shuffle);
  const repeat = usePlayerStore((s) => s.repeat);
  const toggle = usePlayerStore((s) => s.toggle);
  const next = usePlayerStore((s) => s.next);
  const prev = usePlayerStore((s) => s.prev);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);
  const cycleRepeat = usePlayerStore((s) => s.cycleRepeat);
  const requestSeek = usePlayerStore((s) => s.requestSeek);
  const setVolume = usePlayerStore((s) => s.setVolume);
  const toggleExpanded = usePlayerStore((s) => s.toggleExpanded);

  if (!current) return null;

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={cn('fixed inset-x-0 bottom-0 z-[70] border-t border-line bg-surface/95 backdrop-blur', inset && 'lg:left-64')}>
      {/* progress scrubber spanning the top edge */}
      <input
        type="range"
        min={0}
        max={duration || 0}
        value={currentTime}
        onChange={(e) => requestSeek(Number(e.target.value))}
        aria-label="Seek"
        className="player-range absolute -top-1 left-0 h-2 w-full cursor-pointer"
        style={{ '--pct': `${pct}%` } as React.CSSProperties}
      />

      <div className="mx-auto flex max-w-[1320px] items-center gap-3 px-4 py-2.5">
        {/* Track */}
        <button
          onClick={toggleExpanded}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
          aria-label="Open now playing"
        >
          <SongThumb youtubeId={current.youtubeId} title={current.title} iconSize={16} className="h-11 w-11 shrink-0 rounded-md" />

          <span className="min-w-0">
            <span className="flex items-center gap-2 text-sm font-medium text-ink">
              <span className="truncate">{current.title}</span>
              {isPlaying && <Equalizer className="h-3 shrink-0 text-accent-ink" />}
            </span>
            <span className="block truncate text-xs text-muted">{current.artist}</span>
          </span>
          <ChevronUp size={16} className="ml-1 hidden shrink-0 text-muted sm:block" />
        </button>

        {/* Transport */}
        <div className="flex items-center gap-1">
          <button
            onClick={toggleShuffle}
            aria-label="Shuffle"
            title="Shuffle"
            className={cn('hidden h-9 w-9 place-items-center rounded hover:bg-paper-2 sm:grid', shuffle ? 'text-accent-ink' : 'text-muted hover:text-ink')}
          >
            <Shuffle size={16} />
          </button>
          <button onClick={prev} aria-label="Previous" className="grid h-9 w-9 place-items-center rounded text-ink-soft hover:bg-paper-2 hover:text-ink">
            <SkipBack size={18} />
          </button>
          <button
            onClick={toggle}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            className="grid h-10 w-10 place-items-center rounded-full bg-accent text-accent-contrast transition hover:brightness-95"
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} className="translate-x-px" />}
          </button>
          <button onClick={next} aria-label="Next" className="grid h-9 w-9 place-items-center rounded text-ink-soft hover:bg-paper-2 hover:text-ink">
            <SkipForward size={18} />
          </button>
          <button
            onClick={cycleRepeat}
            aria-label={`Repeat: ${repeat}`}
            title={`Repeat: ${repeat}`}
            className={cn('hidden h-9 w-9 place-items-center rounded hover:bg-paper-2 sm:grid', repeat !== 'off' ? 'text-accent-ink' : 'text-muted hover:text-ink')}
          >
            {repeat === 'one' ? <Repeat1 size={16} /> : <Repeat size={16} />}
          </button>
        </div>

        {/* Time */}
        <div className="hidden items-center gap-2 font-sans text-xs tabular-nums text-muted md:flex">
          <span>{formatTime(currentTime)}</span>
          <span aria-hidden="true">/</span>
          <span>{formatTime(duration)}</span>
        </div>

        {/* Volume */}
        <div className="hidden items-center gap-2 lg:flex">
          <Volume2 size={16} className="text-muted" />
          <input
            type="range"
            min={0}
            max={100}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            aria-label="Volume"
            className={cn('player-range h-1.5 w-24 cursor-pointer')}
            style={{ '--pct': `${volume}%` } as React.CSSProperties}
          />
        </div>
      </div>
    </div>
  );
};
