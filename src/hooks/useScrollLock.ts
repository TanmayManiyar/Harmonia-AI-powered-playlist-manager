import { useEffect } from 'react';

// Reference-counted page scroll lock. Several overlays (modals, dialogs) can be
// open at once or overlap while closing; each holds one "lock". The page only
// becomes scrollable again when the last lock is released, so overflow can
// never get stuck on `hidden` the way a save-and-restore of body.style can.
let locks = 0;

function apply() {
  document.body.style.overflow = locks > 0 ? 'hidden' : '';
}

export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    locks += 1;
    apply();
    return () => {
      locks = Math.max(0, locks - 1);
      apply();
    };
  }, [active]);
}
