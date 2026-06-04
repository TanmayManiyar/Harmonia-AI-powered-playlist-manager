import React from 'react';
import { cn } from '../lib/utils';

const COLORS = ['#7c3aed', '#b8e600', '#ff2e88', '#22d3ee', '#ff7a3d', '#a78bfa'];

interface RippleDotsProps {
  rows?: number;
  cols?: number;
  className?: string;
}

/**
 * RippleDots — a small grid of colorful squares (with a hard slant shadow)
 * that pulse in a continuous diagonal ripple. Purely decorative.
 */
export const RippleDots: React.FC<RippleDotsProps> = ({ rows = 6, cols = 7, className }) => {
  const dots: React.ReactNode[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const color = COLORS[(r + c) % COLORS.length];
      dots.push(
        <span
          key={`${r}-${c}`}
          className="ripple-dot"
          style={{ background: color, animationDelay: `${(r + c) * 0.12}s` }}
        />
      );
    }
  }
  return (
    <div
      aria-hidden="true"
      className={cn('ripple-grid', className)}
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {dots}
    </div>
  );
};
