import React, { useState } from 'react';
import { Song } from '../models';
import { api } from '../services/api';
import { usePlaylistStore } from '../store';
import { Button } from './ui/button';
import { BrowseGrid } from './BrowseGrid';
import { cn } from '../lib/utils';

/**
 * SearchPanel — search songs (YouTube-backed) and add to a playlist.
 */
export const SearchPanel: React.FC = () => {
  const [query, setQuery] = useState('');
  const [genreFilter, setGenreFilter] = useState('');
  const [results, setResults] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const playlists = usePlaylistStore((s) => s.getAllPlaylists());
  const addSongToPlaylist = usePlaylistStore((s) => s.addSongToPlaylist);

  const commonGenres = ['Rock', 'Pop', 'Jazz', 'Classical', 'Hip Hop', 'Electronic', 'Country'];

  const handleSearch = async () => {
    setError(null);
    setIsLoading(true);
    try {
      let songs: Song[];
      if (query.trim()) songs = await api.searchSongs(query, genreFilter || undefined);
      else if (genreFilter) songs = await api.searchByGenre(genreFilter);
      else songs = [];
      setResults(songs);
      if (songs.length === 0) setError('No songs found matching your search');
    } catch {
      setError('An unexpected error occurred');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmAdd = async () => {
    if (!selectedSong) return;
    setMessage(null);
    try {
      const targetId = selectedPlaylistId || playlists[0]?.id;
      if (!targetId) {
        setMessage({ type: 'error', text: 'No playlists available. Create one first!' });
        return;
      }
      await addSongToPlaylist(targetId, selectedSong);
      const target = playlists.find((p) => p.id === targetId);
      setMessage({ type: 'success', text: `Added "${selectedSong.title}" to ${target?.name ?? 'playlist'}` });
      setSelectedSong(null);
      setSelectedPlaylistId('');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to add song' });
    }
  };

  const fieldClass =
    'rounded border border-line-strong bg-surface px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none';

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2.5">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Search by title or artist"
          className={cn(fieldClass, 'min-w-48 flex-1 placeholder:text-muted')}
        />
        <select value={genreFilter} onChange={(e) => setGenreFilter(e.target.value)} className={fieldClass}>
          <option value="">All Genres</option>
          {commonGenres.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
        <Button variant="accent" onClick={handleSearch} disabled={isLoading}>
          {isLoading ? 'Searching…' : 'Search'}
        </Button>
      </div>

      {error && <div className="rounded border border-danger/40 px-3 py-2 text-sm text-danger">{error}</div>}
      {message && (
        <div
          className={cn(
            'rounded border px-3 py-2 text-sm',
            message.type === 'success' ? 'border-accent/40 text-accent-ink' : 'border-danger/40 text-danger'
          )}
        >
          {message.text}
        </div>
      )}

      {selectedSong && (
        <div className="rounded-md border border-line bg-paper-2 p-4">
          <h3 className="mb-3 font-display text-base font-semibold text-ink">
            Add “{selectedSong.title}” to a playlist
          </h3>
          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={selectedPlaylistId}
              onChange={(e) => setSelectedPlaylistId(e.target.value)}
              className={cn(fieldClass, 'min-w-48 flex-1')}
            >
              <option value="">{playlists[0] ? `First playlist (${playlists[0].name})` : 'No playlists'}</option>
              {playlists.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <Button variant="ghost" onClick={() => setSelectedSong(null)}>Cancel</Button>
            <Button variant="accent" onClick={handleConfirmAdd}>Add</Button>
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div>
          <h3 className="mb-2.5 text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-muted">
            Results ({results.length})
          </h3>
          <div className="flex flex-col gap-1.5">
            {results.map((song) => (
              <div
                key={song.id}
                className="flex items-center justify-between gap-3 rounded border border-line bg-surface px-3 py-2.5"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-ink">{song.title}</div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
                    <span className="truncate">{song.artist}</span>
                    {song.genre && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>{song.genre}</span>
                      </>
                    )}
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => { setSelectedSong(song); setSelectedPlaylistId(''); setMessage(null); }}>
                  Add
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-line pt-5">
        <p className="mb-4 text-sm text-muted">…or tap a vibe and we'll cook the whole playlist 🍳</p>
        <BrowseGrid />
      </div>
    </div>
  );
};
