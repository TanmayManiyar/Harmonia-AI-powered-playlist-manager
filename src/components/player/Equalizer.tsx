import React from 'react';
import { cn } from '../../lib/utils';

/** Tiny animated equalizer bars — shown on the currently-playing track. */
export const Equalizer: React.FC<{ className?: string }> = ({ className }) => (
  <span className={cn('eq', className)} aria-hidden="true">
    <i />
    <i />
    <i />
    <i />
  </span>
);
