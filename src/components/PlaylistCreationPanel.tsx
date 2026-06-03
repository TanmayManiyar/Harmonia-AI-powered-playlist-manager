import React, { useState } from 'react';
import { usePlaylistStore } from '../store';
import { api } from '../services/api';
import { Button } from './ui/button';
import { cn } from '../lib/utils';

/**
 * PlaylistCreationPanel — genre + languages, generated via Gemini.
 */
export const PlaylistCreationPanel: React.FC = () => {
  const [genre, setGenre] = useState('');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['English']);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const fetchPlaylists = usePlaylistStore((s) => s.fetchPlaylists);

  const commonGenres = ['Rock', 'Pop', 'Jazz', 'Classical', 'Hip Hop', 'Electronic', 'Country', 'Bollywood', 'Metal', 'R&B', 'Latin'];
  const availableLanguages = ['English', 'Hindi', 'Spanish', 'French', 'Korean', 'Japanese', 'Mandarin', 'Portuguese', 'German', 'Italian'];

  const toggleLanguage = (lang: string) => {
    setSelectedLanguages((prev) => {
      if (prev.includes(lang)) return prev.length === 1 ? prev : prev.filter((l) => l !== lang);
      return [...prev, lang];
    });
  };

  const handleCreatePlaylist = async () => {
    setMessage(null);
    const trimmedGenre = genre.trim();
    if (!trimmedGenre) return setMessage({ type: 'error', text: 'Please enter a genre' });
    if (selectedLanguages.length === 0)
      return setMessage({ type: 'error', text: 'Please select at least one language' });

    setIsCreating(true);
    try {
      const prompt = `Create a ${trimmedGenre} playlist. Include exactly 10 songs. Ensure the songs are distributed across these languages: ${selectedLanguages.join(', ')}.`;
      const newPlaylist = await api.chatWithAI(prompt, undefined, trimmedGenre);
      await fetchPlaylists();
      setMessage({
        type: 'success',
        text: `Playlist "${newPlaylist.name}" created with ${newPlaylist.songs?.length || 0} songs (${selectedLanguages.join(', ')}) via AI!`,
      });
      setGenre('');
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to create playlist' });
    } finally {
      setIsCreating(false);
    }
  };

  const chip = (active: boolean) =>
    cn(
      'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
      active
        ? 'border-accent bg-accent/10 text-accent-ink'
        : 'border-line bg-surface text-ink-soft hover:border-line-strong hover:text-ink'
    );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-2.5">
        <input
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreatePlaylist()}
          placeholder="Enter a genre, or pick one below"
          className="flex-1 rounded border border-line-strong bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-none"
        />
        <Button variant="accent" onClick={handleCreatePlaylist} disabled={isCreating}>
          {isCreating ? 'Creating…' : 'Create'}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-muted">Genre</span>
        {commonGenres.map((g) => (
          <button key={g} onClick={() => { setGenre(g); setMessage(null); }} className={chip(genre === g)}>
            {g}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-muted">Languages</span>
        {availableLanguages.map((lang) => (
          <button key={lang} onClick={() => toggleLanguage(lang)} className={chip(selectedLanguages.includes(lang))}>
            {lang}
          </button>
        ))}
      </div>

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
    </div>
  );
};
