import React, { useEffect, useState } from 'react';
import { Play } from 'lucide-react';
import { usePlaylistStore } from '../store';
import { usePlayerStore } from '../store/playerStore';
import { PlaylistCard } from './PlaylistCard';
import { PlaylistDetailModal } from './PlaylistDetailModal';
import { PlaylistCover } from './PlaylistCover';
import { getRecentlyPlayed, recordRecentlyPlayed, RecentPlaylist } from '../lib/recentlyPlayed';

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
};

/** Horizontal, side-scrolling section. */
const Row: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="mb-10">
    <h2 className="mb-4 font-display text-xl font-semibold tracking-tight text-ink">{title}</h2>
    <div className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-2 [scrollbar-width:thin]">{children}</div>
  </section>
);

interface HomeViewProps {
  userName?: string;
}

export const HomeView: React.FC<HomeViewProps> = ({ userName }) => {
  const byGenre = usePlaylistStore((s) => s.getPlaylistsByGenre());
  const allPlaylists = usePlaylistStore((s) => s.getAllPlaylists());
  const playQueue = usePlayerStore((s) => s.playQueue);

  const [recent, setRecent] = useState<RecentPlaylist[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = allPlaylists.find((p) => p.id === selectedId) ?? null;

  useEffect(() => {
    const refresh = () => setRecent(getRecentlyPlayed());
    refresh();
    window.addEventListener('harmonia:recent-updated', refresh);
    return () => window.removeEventListener('harmonia:recent-updated', refresh);
  }, []);

  const playRecent = (p: RecentPlaylist) => {
    playQueue(p.songs, 0);
    recordRecentlyPlayed(p);
  };

  const genreEntries = Array.from(byGenre.entries()).sort((a, b) => a[0].localeCompare(b[0]));

  return (
    <div>
      <h1 className="mb-8 font-display text-3xl font-semibold tracking-tight text-ink">
        {greeting()}{userName ? `, ${userName.split(' ')[0]}` : ''}
      </h1>

      {recent.length > 0 && (
        <Row title="Jump back in">
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

      {allPlaylists.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line bg-surface/50 px-7 py-14 text-center text-sm text-muted">
          Your library is empty. Use Create, Venues, or AI Chat to build your first playlist.
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
