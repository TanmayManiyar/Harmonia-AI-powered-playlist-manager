import React, { useState, useEffect } from 'react';
import { Music } from 'lucide-react';
import { cn, stableIndex } from '../lib/utils';

const FALLBACK = ['#7c3aed', '#f5337f', '#0bb6d6', '#9bcc00', '#ff7a3d', '#a78bfa'];

interface SongThumbProps {
  youtubeId?: string | undefined;
  title?: string;
  className?: string;
  iconSize?: number;
}

/**
 * SongThumb — the song's cover art. Uses the YouTube thumbnail when we have a
 * video id (cropped square), otherwise a deterministic colorful fallback.
 */
export const SongThumb: React.FC<SongThumbProps> = ({ youtubeId, title = '', className, iconSize = 18 }) => {
  const [errored, setErrored] = useState(false);

  // Reset the error state if the video id changes (e.g. bottom bar track swap)
  useEffect(() => setErrored(false), [youtubeId]);

  if (youtubeId && !errored) {
    return (
      <img
        src={`https://i.ytimg.com/vi/${youtubeId}/mqdefault.jpg`}
        alt=""
        loading="lazy"
        onError={() => setErrored(true)}
        className={cn('object-cover', className)}
      />
    );
  }

  const color = FALLBACK[stableIndex(title || youtubeId || 'x', FALLBACK.length)]!;
  return (
    <div className={cn('grid place-items-center text-white/90', className)} style={{ background: color }}>
      <Music size={iconSize} />
    </div>
  );
};
