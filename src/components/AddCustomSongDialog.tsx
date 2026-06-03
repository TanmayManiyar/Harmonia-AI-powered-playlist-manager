import React, { useState } from 'react';
import { usePlaylistStore } from '../store';
import { Modal } from './Modal';
import { Button } from './ui/button';

interface AddCustomSongDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * AddCustomSongDialog — manually add a song to a chosen playlist.
 */
export const AddCustomSongDialog: React.FC<AddCustomSongDialogProps> = ({ isOpen, onClose }) => {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [genre, setGenre] = useState('');
  const [language, setLanguage] = useState('');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const addSongToPlaylist = usePlaylistStore((s) => s.addSongToPlaylist);
  const playlists = usePlaylistStore((s) => s.getAllPlaylists());

  const reset = () => {
    setTitle(''); setArtist(''); setGenre(''); setLanguage('');
    setSelectedPlaylistId(''); setErrors([]); setMessage(null);
  };

  const handleAdd = async () => {
    const errs: string[] = [];
    if (!title.trim()) errs.push('Song title is required');
    if (!artist.trim()) errs.push('Artist name is required');
    if (!selectedPlaylistId) errs.push('Please select a playlist');
    setErrors(errs);
    setMessage(null);
    if (errs.length) return;

    const song = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      title: title.trim(),
      artist: artist.trim(),
      genre: genre.trim() || 'Unknown',
      language: language.trim(),
      isCustom: true,
    };
    try {
      await addSongToPlaylist(selectedPlaylistId, song);
      setMessage({ type: 'success', text: `Added "${song.title}"` });
      setTimeout(() => { onClose(); reset(); }, 1200);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to add song' });
    }
  };

  const field = 'rounded border border-line-strong bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-none';

  return (
    <Modal isOpen={isOpen} onClose={() => { onClose(); reset(); }} title="Add Custom Song" size="sm">
      <div className="flex flex-col gap-3.5">
        {[
          { id: 'title', label: 'Title *', value: title, set: setTitle, ph: 'Song title' },
          { id: 'artist', label: 'Artist *', value: artist, set: setArtist, ph: 'Artist name' },
          { id: 'genre', label: 'Genre', value: genre, set: setGenre, ph: 'Genre (optional)' },
          { id: 'language', label: 'Language', value: language, set: setLanguage, ph: 'Language (optional)' },
        ].map((f) => (
          <div key={f.id} className="flex flex-col gap-1.5">
            <label htmlFor={f.id} className="text-xs font-medium text-ink-soft">{f.label}</label>
            <input id={f.id} value={f.value} onChange={(e) => f.set(e.target.value)} placeholder={f.ph} className={field} />
          </div>
        ))}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="pl" className="text-xs font-medium text-ink-soft">Add to Playlist *</label>
          <select id="pl" value={selectedPlaylistId} onChange={(e) => setSelectedPlaylistId(e.target.value)} className={field}>
            <option value="">Select a playlist</option>
            {playlists.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        {errors.length > 0 && (
          <div className="flex flex-col gap-1">
            {errors.map((e, i) => <div key={i} className="text-sm text-danger">{e}</div>)}
          </div>
        )}
        {message && (
          <div className={message.type === 'success' ? 'text-sm text-accent-ink' : 'text-sm text-danger'}>{message.text}</div>
        )}

        <div className="mt-1 flex justify-end gap-2.5">
          <Button variant="ghost" onClick={() => { onClose(); reset(); }}>Cancel</Button>
          <Button variant="accent" onClick={handleAdd}>Add Song</Button>
        </div>
      </div>
    </Modal>
  );
};
