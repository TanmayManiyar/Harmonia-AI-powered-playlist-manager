import React from 'react';
import './layout.css';

/**
 * Blobs — four large, blurred, slowly drifting color orbs that sit behind
 * all content and give the glass surfaces something vivid to refract.
 * Purely decorative; aria-hidden and pointer-events: none.
 */
export const Blobs: React.FC = () => {
  return (
    <div className="blobs" aria-hidden="true">
      <span className="blob blob--violet" />
      <span className="blob blob--fuchsia" />
      <span className="blob blob--sky" />
      <span className="blob blob--emerald" />
    </div>
  );
};
