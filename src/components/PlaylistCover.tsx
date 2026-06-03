import React from 'react';
import { cn, stableIndex } from '../lib/utils';

/** Vivid Acid-Pop duotones — {field background, bold type}. */
const PALETTES: { bg: string; fg: string }[] = [
  { bg: '#C6FF3A', fg: '#15121C' }, // acid lime
  { bg: '#7C3AED', fg: '#F7F0FF' }, // grape
  { bg: '#FF2E88', fg: '#1A0E14' }, // bubblegum
  { bg: '#22D3EE', fg: '#0C1418' }, // ice
  { bg: '#15121C', fg: '#C6FF3A' }, // ink + acid
  { bg: '#191225', fg: '#FF6AD5' }, // ink + pink
  { bg: '#FF7A3D', fg: '#1A0E08' }, // tangerine
  { bg: '#A78BFA', fg: '#1A1030' }, // soft grape
];

interface PlaylistCoverProps {
  name: string;
  genre: string;
  /** 1-based ordinal shown small in the corner */
  index?: number | undefined;
  variant?: 'tile' | 'thumb';
  className?: string;
}

/**
 * PlaylistCover — a deterministic typographic cover. Same name+genre always
 * yields the same palette, so covers are stable without being stored.
 */
export const PlaylistCover: React.FC<PlaylistCoverProps> = ({
  name,
  genre,
  index,
  variant = 'tile',
  className,
}) => {
  const palette = PALETTES[stableIndex(`${name}|${genre}`, PALETTES.length)]!;
  const isThumb = variant === 'thumb';

  return (
    <div
      className={cn(
        'relative flex flex-col justify-between overflow-hidden',
        isThumb ? 'p-3' : 'p-4',
        className
      )}
      style={{ background: palette.bg, color: palette.fg }}
      aria-hidden="true"
    >
      {/* hairline framing rule for an editorial feel */}
      <span
        className="pointer-events-none absolute inset-2 rounded-[2px] border"
        style={{ borderColor: `${palette.fg}22` }}
      />

      <span
        className={cn(
          'relative font-display font-semibold leading-[0.97] line-clamp-3',
          isThumb ? 'text-sm' : 'text-[1.5rem]'
        )}
      >
        {name}
      </span>

      {index != null && (
        <span
          className={cn(
            'relative self-end font-display tabular-nums',
            isThumb ? 'text-xs' : 'text-sm'
          )}
          style={{ color: `${palette.fg}99` }}
        >
          {String(index).padStart(2, '0')}
        </span>
      )}
    </div>
  );
};
