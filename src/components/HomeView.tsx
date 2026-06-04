import React, { useEffect, useState } from 'react';
import { Play, Plus, Check, Loader2, RotateCw, Sparkles } from 'lucide-react';
import { usePlaylistStore } from '../store';
import { usePlayerStore } from '../store/playerStore';
import { api, DiscoverPlaylist, SuggestedPlaylist } from '../services/api';
import { PlaylistCard } from './PlaylistCard';
import { PlaylistDetailModal } from './PlaylistDetailModal';
import { PlaylistCover } from './PlaylistCover';
import { BrowseGrid } from './BrowseGrid';
import { getRecentlyPlayed, recordRecentlyPlayed, RecentPlaylist } from '../lib/recentlyPlayed';
import { CATEGORY_GROUPS } from '../lib/categories';

const HOME_BROWSE = CATEGORY_GROUPS.filter(
  (g) => g.title.startsWith('moods') || g.title.startsWith('charts')
);

const FORYOU_KEY = 'playlist-manager:foryou';
const today = () => new Date().toISOString().slice(0, 10);

function loadForYouCache(): SuggestedPlaylist[] | null {
  try {
    const raw = localStorage.getItem(FORYOU_KEY);
    if (!raw) return null;
    const c = JSON.parse(raw);
    if (c?.date === today() && Array.isArray(c.playlists)) return c.playlists;
  } catch {
    /* ignore */
  }
  return null;
}

function saveForYouCache(playlists: SuggestedPlaylist[]) {
  try {
    localStorage.setItem(FORYOU_KEY, JSON.stringify({ date: today(), playlists }));
  } catch {
    /* ignore */
  }
}

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'rise & grind';
  if (h < 18) return 'afternoon vibes';
  return 'evening, fam';
};

/** Horizontal, side-scrolling section. */
const Row: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="mb-10">
    <h2 className="mb-4 font-display text-xl font-bold tracking-tight text-ink">{title}</h2>
    <div className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-2 [scrollbar-width:thin]">{children}</div>
  </section>
);

interface HomeViewProps {
  userName?: string;
}

export const HomeView: React.FC<HomeViewProps> = ({ userName }) => {
  const byGenre = usePlaylistStore((s) => s.getPlaylistsByGenre());
  const allPlaylists = usePlaylistStore((s) => s.getAllPlaylists());
  const fetchPlaylists = usePlaylistStore((s) => s.fetchPlaylists);
  const playQueue = usePlayerStore((s) => s.playQueue);

  const [recent, setRecent] = useState<RecentPlaylist[]>([]);
  const [popular, setPopular] = useState<DiscoverPlaylist[]>([]);
  const [forYou, setForYou] = useState<SuggestedPlaylist[]>([]);
  const [forYouLoading, setForYouLoading] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [moodText, setMoodText] = useState('');
  const [moodLoading, setMoodLoading] = useState(false);
  const [moodError, setMoodError] = useState('');
  const [showAllVibes, setShowAllVibes] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = allPlaylists.find((p) => p.id === selectedId) ?? null;

  useEffect(() => {
    const refresh = () => setRecent(getRecentlyPlayed());
    refresh();
    window.addEventListener('harmonia:recent-updated', refresh);
    return () => window.removeEventListener('harmonia:recent-updated', refresh);
  }, []);

  useEffect(() => {
    api
      .getDiscover()
      .then((d) => setPopular(d.popular))
      .catch(() => setPopular([]));
  }, []);

  // Generate on demand (not auto) — Gemini calls are precious on the free tier.
  const fetchForYou = () => {
    setForYouLoading(true);
    const genres = [...new Set(getRecentlyPlayed().map((r) => r.genre).filter(Boolean))];
    api
      .getForYou(genres)
      .then((d) => {
        setForYou(d.playlists);
        saveForYouCache(d.playlists);
      })
      .catch(() => setForYou([]))
      .finally(() => setForYouLoading(false));
  };

  // Show today's cached recs if we already generated them; never auto-call.
  useEffect(() => {
    const cached = loadForYouCache();
    if (cached && cached.length > 0) setForYou(cached);
  }, []);

  const playSuggested = (p: SuggestedPlaylist) => {
    if (playQueue(p.songs, 0) > 0) {
      recordRecentlyPlayed({ id: p.id, name: p.name, genre: p.genre, songs: p.songs });
    }
  };

  const saveSuggested = async (p: SuggestedPlaylist) => {
    try {
      await api.createPlaylist(p.genre, p.name, p.songs);
      await fetchPlaylists();
      setSavedIds((prev) => new Set(prev).add(p.id));
    } catch {
      /* ignore */
    }
  };

  const cookMood = async () => {
    const mood = moodText.trim();
    if (!mood || moodLoading) return;
    setMoodLoading(true);
    setMoodError('');
    try {
      await api.chatWithAI(`A playlist for this exact vibe: ${mood}. Match the energy and mood closely.`, mood, 'Mood');
      await fetchPlaylists();
      setMoodText('');
    } catch (e: any) {
      setMoodError(e?.message || 'could not cook that one — try again');
    } finally {
      setMoodLoading(false);
    }
  };

  const toRecent = (p: { _id?: string; id?: string; name: string; genre: string; songs: RecentPlaylist['songs'] }): RecentPlaylist => ({
    id: p._id || p.id || '',
    name: p.name,
    genre: p.genre,
    songs: p.songs ?? [],
  });

  const playRecent = (p: RecentPlaylist) => {
    if (playQueue(p.songs, 0) > 0) {
      recordRecentlyPlayed(p);
      if (p.id) api.markPlayed(p.id);
    }
  };

  const playDiscover = (p: DiscoverPlaylist) => {
    const r = toRecent(p);
    if (playQueue(r.songs, 0) > 0) {
      recordRecentlyPlayed(r);
      if (r.id) api.markPlayed(r.id);
    }
  };

  const genreEntries = Array.from(byGenre.entries()).sort((a, b) => a[0].localeCompare(b[0]));

  return (
    <div>
      <h1 className="mb-8 font-display text-4xl font-bold tracking-tight text-ink">
        {greeting()}{userName ? `, ${userName.split(' ')[0]}` : ''} <span className="text-gradient">🎧</span>
      </h1>

      {recent.length > 0 && (
        <Row title="On Repeat 🔁">
          {recent.map((p) => (
            <button
              key={p.id}
              onClick={() => playRecent(p)}
              className="group relative w-40 shrink-0 overflow-hidden rounded-md border border-line bg-surface text-left shadow-[var(--shadow)] transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-lg)]"
            >
              <PlaylistCover name={p.name} genre={p.genre} className="aspect-[4/3] w-full" />
              <span className="absolute bottom-14 right-2.5 grid h-9 w-9 translate-y-1 place-items-center rounded-full bg-accent text-accent-contrast opacity-0 shadow-[var(--shadow)] transition-all group-hover:translate-y-0 group-hover:opacity-100">
                <Play size={16} className="translate-x-px" />
              </span>
              <span className="block px-3 py-2.5 text-xs text-muted">{p.genre} · {p.songs.length} songs</span>
            </button>
          ))}
        </Row>
      )}

      {popular.length > 0 && (
        <Row title="Trending rn 🔥">
          {popular.map((p) => (
            <button
              key={p._id || p.id}
              onClick={() => playDiscover(p)}
              className="group relative w-44 shrink-0 overflow-hidden rounded-md border border-line bg-surface text-left shadow-[var(--shadow)] transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-lg)]"
            >
              <PlaylistCover name={p.name} genre={p.genre} className="aspect-[4/3] w-full" />
              <span className="absolute bottom-[3.4rem] right-2.5 grid h-9 w-9 translate-y-1 place-items-center rounded-full bg-accent text-accent-contrast opacity-0 shadow-[var(--shadow)] transition-all group-hover:translate-y-0 group-hover:opacity-100">
                <Play size={16} className="translate-x-px" />
              </span>
              <span className="block px-3.5 py-3">
                <span className="block truncate text-xs text-muted">{p.genre} · by {p.ownerName}</span>
              </span>
            </button>
          ))}
        </Row>
      )}

      <section className="mb-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold tracking-tight text-ink">Made 4 U fr</h2>
          {forYou.length > 0 && (
            <button
              onClick={fetchForYou}
              disabled={forYouLoading}
              className="flex items-center gap-1.5 text-xs font-medium text-muted transition-colors hover:text-ink disabled:opacity-50"
            >
              <RotateCw size={13} className={forYouLoading ? 'animate-spin' : ''} /> refresh
            </button>
          )}
        </div>
        {forYouLoading ? (
          <div className="flex items-center gap-2 px-1 py-10 text-sm text-muted">
            <Loader2 size={16} className="animate-spin" /> cooking up your recs… 👨‍🍳
          </div>
        ) : forYou.length === 0 ? (
          <button
            onClick={fetchForYou}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line-strong px-6 py-8 text-sm font-semibold text-ink-soft transition-colors hover:border-accent hover:text-accent-ink"
          >
            <Sparkles size={16} /> cook my recs ✨ <span className="text-xs font-normal text-muted">(uses AI)</span>
          </button>
        ) : (
          <>
            <div className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-2">
              {forYou.map((p) => (
                <div
                  key={p.id}
                  className="group relative w-44 shrink-0 overflow-hidden rounded-md border border-line bg-surface shadow-[var(--shadow)] transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-lg)]"
                >
                  <button onClick={() => playSuggested(p)} aria-label={`Play ${p.name}`} className="block w-full text-left">
                    <PlaylistCover name={p.name} genre={p.genre} className="aspect-[4/3] w-full" />
                    <span className="absolute right-2.5 top-[5.6rem] grid h-9 w-9 translate-y-1 place-items-center rounded-full bg-accent text-accent-contrast opacity-0 shadow-[var(--shadow)] transition-all group-hover:translate-y-0 group-hover:opacity-100">
                      <Play size={16} className="translate-x-px" />
                    </span>
                  </button>
                  <div className="flex items-center justify-between gap-2 px-3.5 py-3">
                    <span className="truncate text-xs text-muted">{p.genre} · {p.songs.length} songs</span>
                    <button
                      onClick={() => saveSuggested(p)}
                      disabled={savedIds.has(p.id)}
                      aria-label={savedIds.has(p.id) ? 'Saved' : `Save ${p.name}`}
                      className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-line text-ink-soft transition-colors hover:border-accent hover:text-accent-ink disabled:border-accent/40 disabled:text-accent-ink"
                    >
                      {savedIds.has(p.id) ? <Check size={14} /> : <Plus size={14} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      <section className="mb-10">
        <h2 className="mb-4 font-display text-xl font-bold tracking-tight text-ink">pick a vibe 🎟️</h2>
        <div className="mb-5 flex flex-wrap gap-2.5">
          <input
            value={moodText}
            onChange={(e) => setMoodText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && cookMood()}
            placeholder="type any mood… rainy day, heartbreak, gym 🏋️, 3am drive"
            className="min-w-56 flex-1 rounded-full border-2 border-line-strong bg-surface px-4 py-2.5 text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-none"
          />
          <button
            onClick={cookMood}
            disabled={moodLoading || !moodText.trim()}
            className="rounded-full bg-accent px-5 text-sm font-semibold text-accent-contrast shadow-[0_4px_0_0_rgba(0,0,0,0.22)] transition-all hover:brightness-110 hover:translate-y-0.5 hover:shadow-[0_2px_0_0_rgba(0,0,0,0.22)] active:scale-95 disabled:opacity-50"
          >
            {moodLoading ? 'cooking…' : 'cook it 🍳'}
          </button>
        </div>
        {moodError && (
          <div className="mb-4 rounded-lg border border-danger/40 px-3 py-2 text-sm text-danger">{moodError}</div>
        )}
        <BrowseGrid
          groups={showAllVibes ? CATEGORY_GROUPS : HOME_BROWSE}
          limitPerGroup={showAllVibes ? undefined : 4}
        />
        <div className="mt-1 flex justify-center">
          <button
            onClick={() => setShowAllVibes((v) => !v)}
            className="rounded-full border-2 border-line-strong px-5 py-2 text-sm font-semibold text-ink-soft transition-colors hover:border-accent hover:text-accent-ink"
          >
            {showAllVibes ? 'see less' : 'see more'}
          </button>
        </div>
      </section>

      {allPlaylists.length === 0 ? (
        <p className="rounded-2xl border-2 border-dashed border-line bg-surface/50 px-7 py-14 text-center text-sm text-muted">
          your library's a ghost town rn 👻 — hit Create, Venues, or AI Chat to cook up your first playlist.
        </p>
      ) : (
        genreEntries.map(([genre, playlists]) => (
          <Row key={genre} title={genre}>
            {playlists.map((playlist, i) => (
              <div key={playlist.id} className="w-44 shrink-0">
                <PlaylistCard playlist={playlist} onOpen={setSelectedId} index={i + 1} />
              </div>
            ))}
          </Row>
        ))
      )}

      <PlaylistDetailModal playlist={selected} isOpen={selected !== null} onClose={() => setSelectedId(null)} />
    </div>
  );
};
