const COLORS = ['#7c3aed', '#b8e600', '#ff2e88', '#22d3ee', '#ff7a3d', '#a78bfa'];

/** A quick burst of colorful square confetti from a point (default: center). */
export function burstConfetti(x?: number, y?: number): void {
  if (typeof document === 'undefined') return;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

  const cx = x ?? window.innerWidth / 2;
  const cy = y ?? window.innerHeight / 2;

  const container = document.createElement('div');
  container.style.cssText =
    'position:fixed;inset:0;pointer-events:none;z-index:200;overflow:hidden;';

  for (let i = 0; i < 30; i++) {
    const p = document.createElement('span');
    const color = COLORS[i % COLORS.length];
    const angle = Math.random() * Math.PI * 2;
    const dist = 70 + Math.random() * 140;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist - 50; // bias upward
    const size = 6 + Math.random() * 9;
    p.style.cssText =
      `position:absolute;left:${cx}px;top:${cy}px;width:${size}px;height:${size}px;` +
      `background:${color};border-radius:2px;box-shadow:2px 3px 0 0 rgba(0,0,0,.18);` +
      'transform:translate(-50%,-50%);will-change:transform,opacity;';
    container.appendChild(p);
    const anim = p.animate(
      [
        { transform: 'translate(-50%,-50%) rotate(0deg)', opacity: 1 },
        { transform: `translate(${dx}px,${dy}px) rotate(${Math.random() * 720 - 360}deg)`, opacity: 0 },
      ],
      { duration: 700 + Math.random() * 450, easing: 'cubic-bezier(0.16,1,0.3,1)' }
    );
    anim.onfinish = () => p.remove();
  }

  document.body.appendChild(container);
  setTimeout(() => container.remove(), 1500);
}
