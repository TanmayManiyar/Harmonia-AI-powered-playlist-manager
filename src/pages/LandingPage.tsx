import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Store, MonitorPlay, Share2, ArrowRight, Play } from 'lucide-react';
import { useAuthModalStore } from '../store/authModalStore';
import { Button } from '../components/ui/button';
import { ThemeToggle } from '../components/ThemeToggle';
import { PlaylistCover } from '../components/PlaylistCover';

const ease = [0.16, 1, 0.3, 1] as const;

const Reveal: React.FC<{ children: React.ReactNode; delay?: number; className?: string }> = ({
  children, delay = 0, className,
}) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, y: 28 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-80px' }}
    transition={{ duration: 0.7, ease, delay }}
  >
    {children}
  </motion.div>
);

const FEATURES = [
  { icon: <Sparkles size={22} />, bg: 'var(--grape)', fg: '#fff', title: 'AI that just gets it', body: 'Type a vibe in plain words and Gemini cooks a playlist tuned to your taste. No skips. No cap.' },
  { icon: <Store size={22} />, bg: 'var(--bubble)', fg: '#fff', title: 'one tap, any vibe', body: 'Cafe, gym, pre-game, spa — tap a mood and get a set built for the exact energy. Lowkey magic.' },
  { icon: <MonitorPlay size={22} />, bg: 'var(--ice)', fg: '#0c1418', title: 'plays right here fr', body: 'A real player lives in the app. Quiet bottom bar that pops into a full now-playing with your queue.' },
  { icon: <Share2 size={22} />, bg: 'var(--acid)', fg: '#15121c', title: 'share the aux', body: 'Send any playlist as one clean link. They sign in, hit play, instantly understood the assignment.' },
];

const CHIPS = ['lofi study 📚', 'gym bangers 💪', 'sad girl autumn 🍂', 'bollywood throwbacks', 'rage 🔊', 'main character', 'cafe jazz ☕', 'y2k pop'];

export const LandingPage: React.FC = () => {
  const open = useAuthModalStore((s) => s.open);

  return (
    <div className="min-h-screen overflow-x-hidden bg-paper">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-line/70 bg-paper/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 lg:px-8">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent font-display text-base font-bold text-accent-contrast">H</span>
            <span className="font-display text-lg font-bold tracking-tight text-ink">Harmonia</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => open('login')}>sign in</Button>
            <Button variant="accent" size="sm" onClick={() => open('register')}>get started</Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative mx-auto max-w-6xl px-5 pb-20 pt-20 text-center lg:px-8 lg:pt-28">
        {/* playful blobs */}
        <div aria-hidden className="pointer-events-none absolute -top-10 left-6 h-40 w-40 rounded-full opacity-30 blur-3xl" style={{ background: 'var(--bubble)' }} />
        <div aria-hidden className="pointer-events-none absolute right-8 top-20 h-44 w-44 rounded-full opacity-25 blur-3xl" style={{ background: 'var(--ice)' }} />

        <Reveal>
          <span className="inline-flex items-center gap-2 rounded-full border-2 border-ink bg-surface px-4 py-1.5 text-xs font-bold text-ink shadow-[var(--shadow-pop)]">
            <Sparkles size={13} className="text-bubble" /> made by AI · certified bussin
          </span>
        </Reveal>
        <Reveal delay={0.06}>
          <h1 className="mx-auto mt-8 max-w-4xl font-display text-5xl font-bold leading-[0.98] tracking-tight text-ink sm:text-7xl lg:text-[5.5rem]">
            your music,
            <br />
            <span className="text-gradient">but make it slay.</span>
          </h1>
        </Reveal>
        <Reveal delay={0.12}>
          <p className="mx-auto mt-7 max-w-xl text-lg leading-relaxed text-muted">
            Harmonia turns one sentence into the perfect playlist — built by AI, tuned to your taste,
            and played without ever leaving the page. it's giving main character energy. 🎧
          </p>
        </Reveal>
        <Reveal delay={0.18}>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Button variant="accent" size="lg" onClick={() => open('register')}>
              let's get this bread 🍞 <ArrowRight size={16} />
            </Button>
            <Button variant="outline" size="lg" onClick={() => open('login')}>i'm already in</Button>
          </div>
        </Reveal>

        {/* vibe chips */}
        <Reveal delay={0.22}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
            {CHIPS.map((c, i) => (
              <span
                key={c}
                className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-ink-soft"
                style={{ background: `color-mix(in srgb, ${['var(--grape)', 'var(--bubble)', 'var(--ice)', 'var(--acid)'][i % 4]} 12%, transparent)` }}
              >
                {c}
              </span>
            ))}
          </div>
        </Reveal>

        {/* Product mock */}
        <Reveal delay={0.26} className="mt-16">
          <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl border-2 border-ink bg-surface shadow-[var(--shadow-pop)]">
            <div className="flex items-center gap-1.5 border-b-2 border-ink px-4 py-3">
              <span className="h-3 w-3 rounded-full" style={{ background: 'var(--bubble)' }} />
              <span className="h-3 w-3 rounded-full" style={{ background: 'var(--acid)' }} />
              <span className="h-3 w-3 rounded-full" style={{ background: 'var(--ice)' }} />
            </div>
            <div className="p-6">
              <div className="mb-4 text-left font-display text-lg font-bold text-ink">On Repeat 🔁</div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[['Midnight Jazz', 'Jazz'], ['Cosmic Drive', 'Electronic'], ['Sad Girl Hours', 'Indie'], ['Gym Bangers', 'Hype']].map(([n, g], i) => (
                  <PlaylistCover key={n} name={n!} genre={g!} index={i + 1} className="aspect-[4/3] rounded-xl" />
                ))}
              </div>
              <div className="mt-5 flex items-center gap-3 rounded-xl border-2 border-ink bg-paper-2 px-3 py-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-accent text-accent-contrast"><Play size={15} className="translate-x-px" /></span>
                <div className="text-left">
                  <div className="text-sm font-bold text-ink">So What</div>
                  <div className="text-xs text-muted">Miles Davis · bussin 🔥</div>
                </div>
                <div className="ml-auto hidden h-1.5 w-40 overflow-hidden rounded-full bg-line-strong sm:block">
                  <div className="h-full w-1/3 rounded-full" style={{ background: 'var(--bubble)' }} />
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Features */}
      <section className="border-t-2 border-ink" style={{ background: 'color-mix(in srgb, var(--grape) 5%, var(--paper))' }}>
        <div className="mx-auto max-w-6xl px-5 py-24 lg:px-8">
          <Reveal>
            <h2 className="max-w-2xl font-display text-3xl font-bold tracking-tight text-ink sm:text-5xl">
              everything you need to find the moment's sound. <span className="text-gradient">fr fr.</span>
            </h2>
          </Reveal>
          <div className="mt-14 grid gap-5 sm:grid-cols-2">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={(i % 2) * 0.08}>
                <div className="flex h-full gap-4 rounded-2xl border-2 border-ink bg-surface p-6 shadow-[var(--shadow-pop)] transition-transform hover:-translate-y-1">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl" style={{ background: f.bg, color: f.fg }}>
                    {f.icon}
                  </span>
                  <div>
                    <h3 className="font-display text-xl font-bold text-ink">{f.title}</h3>
                    <p className="mt-1.5 text-[0.95rem] leading-relaxed text-muted">{f.body}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Statement */}
      <section className="mx-auto max-w-5xl px-5 py-28 text-center lg:px-8">
        <Reveal>
          <p className="font-display text-3xl font-bold leading-snug tracking-tight text-ink sm:text-5xl">
            one sentence in,
            <span className="text-muted"> a whole vibe out.</span>
          </p>
        </Reveal>
      </section>

      {/* CTA band */}
      <section className="border-t-2 border-ink" style={{ background: 'color-mix(in srgb, var(--bubble) 8%, var(--paper))' }}>
        <div className="mx-auto max-w-6xl px-5 py-24 text-center lg:px-8">
          <Reveal>
            <h2 className="font-display text-4xl font-bold tracking-tight text-ink sm:text-6xl">
              get in, we're making <span className="text-gradient">playlists.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-md text-muted">free to try. your first banger is one sentence away.</p>
            <div className="mt-8">
              <Button variant="accent" size="lg" onClick={() => open('register')}>
                start vibing <ArrowRight size={16} />
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      <footer className="border-t-2 border-ink">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-8 text-sm text-muted sm:flex-row lg:px-8">
          <div className="flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-md bg-accent font-display text-xs font-bold text-accent-contrast">H</span>
            <span className="font-display font-bold text-ink">Harmonia</span>
          </div>
          <span>© {new Date().getFullYear()} Harmonia · made with mad love 💜</span>
        </div>
      </footer>

      <ThemeToggle />
    </div>
  );
};
