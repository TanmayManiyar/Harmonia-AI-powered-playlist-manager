import React from 'react';
import { cn, stableIndex } from '../lib/utils';

/** Muted editorial duotones — {field background, type ink}. No neon. */
const PALETTES: { bg: string; fg: string }[] = [
  { bg: '#E8DFD3', fg: '#9C4A2A' }, // terracotta on cream
  { bg: '#DCE3DA', fg: '#2F4A3A' }, // forest on sage
  { bg: '#ECE9E1', fg: '#1B1A16' }, // ink on bone
  { bg: '#EBE3D1', fg: '#8A6A1F' }, // ochre on linen
  { bg: '#DEE2E5', fg: '#33414B' }, // slate on mist
  { bg: '#E9DEE2', fg: '#6A2E45' }, // plum on blush
  { bg: '#E3E0D6', fg: '#3A4030' }, // olive on stone
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
