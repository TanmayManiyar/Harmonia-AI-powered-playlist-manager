import { useEffect } from 'react';
import { usePlayerStore } from '../store/playerStore';

const INTERACTIVE = ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A'];

/**
 * Global media keys (only when not focused on a control / not typing):
 *   Space         play / pause
 *   ← / →         seek -5s / +5s
 *   Shift + ← / → previous / next
 */
export function useMediaKeys() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (INTERACTIVE.includes(t.tagName) || t.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const st = usePlayerStore.getState();
      if (st.queue.length === 0) return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          st.toggle();
          break;
        case 'ArrowRight':
          if (e.shiftKey) st.next();
          else st.requestSeek(st.currentTime + 5);
          break;
        case 'ArrowLeft':
          if (e.shiftKey) st.prev();
          else st.requestSeek(Math.max(0, st.currentTime - 5));
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
