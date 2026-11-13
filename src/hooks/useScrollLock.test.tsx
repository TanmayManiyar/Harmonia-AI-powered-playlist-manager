import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useScrollLock } from './useScrollLock';

describe('useScrollLock', () => {
  it('unlocks only after the last overlay releases, in any order', () => {
    const a = renderHook(() => useScrollLock(true));
    const b = renderHook(() => useScrollLock(true));
    expect(document.body.style.overflow).toBe('hidden');
    a.unmount(); // first opened closes first (the order that used to stick)
    expect(document.body.style.overflow).toBe('hidden');
    b.unmount();
    expect(document.body.style.overflow).toBe('');
  });

  it('does nothing while inactive', () => {
    const { rerender, unmount } = renderHook(({ on }) => useScrollLock(on), { initialProps: { on: false } });
    expect(document.body.style.overflow).toBe('');
    rerender({ on: true });
    expect(document.body.style.overflow).toBe('hidden');
    rerender({ on: false });
    expect(document.body.style.overflow).toBe('');
    unmount();
  });
});
