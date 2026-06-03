import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Play, ArrowLeft, Loader2 } from 'lucide-react';
import { api, ApiPlaylist } from '../services/api';
import { Song } from '../models';
import { SongItem } from '../components/SongItem';
import { PlaylistCover } from '../components/PlaylistCover';
import { Button } from '../components/ui/button';
import { PlayerHost } from '../components/player/PlayerHost';
import { PlayerBar } from '../components/player/PlayerBar';
import { NowPlayingPanel } from '../components/player/NowPlayingPanel';
import { ThemeToggle } from '../components/ThemeToggle';
import { usePlayerStore, isPlayable } from '../store/playerStore';
import { recordRecentlyPlayed } from '../lib/recentlyPlayed';

export const SharedPlaylistPage: React.FC = () => {
  const { shareId } = useParams<{ shareId: string }>();
  const [playlist, setPlaylist] = useState<ApiPlaylist | null>(null);
  const [ownerName, setOwnerName] = useState('');
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  const playQueue = usePlayerStore((s) => s.playQueue);
  const playingSongId = usePlayerStore((s) => s.queue[s.index]?.id ?? null);

  useEffect(() => {
    if (!shareId) return;
    let active = true;
    api
      .getSharedPlaylist(shareId)
      .then((data) => {
        if (!active) return;
        setPlaylist(data.playlist);
        setOwnerName(data.ownerName);
        setStatus('ready');
      })
      .catch(() => active && setStatus('error'));
    return () => {
      active = false;
    };
  }, [shareId]);

  const songs: Song[] = playlist?.songs ?? [];
  const playableCount = songs.filter(isPlayable).length;

  const playFrom = (i: number) => {
    if (!playlist) return;
    if (playQueue(songs, i) > 0) {
      const id = playlist._id || playlist.id || '';
      recordRecentlyPlayed({ id, name: playlist.name, genre: playlist.genre, songs });
      if (id) api.markPlayed(id);
    }
  };

  return (
    <div className="min-h-screen bg-paper">
      <header className="flex items-center justify-between border-b border-line px-5 py-4 lg:px-10">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded bg-accent font-display text-base font-bold text-accent-contrast">
            H
          </span>
          <span className="font-display text-lg font-semibold tracking-tight text-ink">Harmonia</span>
        </Link>
        <Link to="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft size={15} /> Back to app
          </Button>
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-5 pb-28 pt-8 lg:pt-12">
        {status === 'loading' && (
          <div className="flex items-center justify-center gap-2 py-24 text-muted">
            <Loader2 size={18} className="animate-spin" /> Loading shared playlist…
          </div>
        )}

        {status === 'error' && (
          <div className="rounded-lg border border-dashed border-line bg-surface/50 px-7 py-16 text-center">
            <p className="font-display text-xl font-semibold text-ink">Playlist not found</p>
            <p className="mt-2 text-sm text-muted">This share link is invalid or has been revoked.</p>
            <Link to="/" className="mt-5 inline-block">
              <Button variant="accent" size="sm">Go to Harmonia</Button>
            </Link>
          </div>
        )}

        {status === 'ready' && playlist && (
          <>
            <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-end">
              <PlaylistCover
                name={playlist.name}
                genre={playlist.genre}
                className="h-36 w-36 shrink-0 rounded-lg"
              />
              <div className="min-w-0">
                <span className="text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-muted">
                  Shared playlist
                </span>
                <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-ink">
                  {playlist.name}
                </h1>
                <p className="mt-1.5 text-sm text-muted">
                  {playlist.genre} · {songs.length} songs · by {ownerName}
                </p>
                <Button
                  variant="accent"
                  className="mt-4"
                  disabled={playableCount === 0}
                  onClick={() => playFrom(0)}
                >
                  <Play size={16} /> Play all
                </Button>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-1.5">
              {songs.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted">This playlist has no songs.</p>
              ) : (
                songs.map((song, i) => (
                  <SongItem
                    key={song.id}
                    song={song}
                    showRemoveButton={false}
                    isActive={song.id === playingSongId}
                    onPlay={() => playFrom(i)}
                  />
                ))
              )}
            </div>
          </>
        )}
      </main>

      <PlayerHost />
      <PlayerBar />
      <NowPlayingPanel />
      <ThemeToggle />
    </div>
  );
};
