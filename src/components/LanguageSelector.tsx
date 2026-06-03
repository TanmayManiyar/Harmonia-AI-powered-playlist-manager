import React from 'react';
import { usePlaylistStore } from '../store';

/**
 * LanguageSelector — sets the language preference in the playlist store.
 */
export const LanguageSelector: React.FC = () => {
  const languagePreference = usePlaylistStore((s) => s.languagePreference);
  const setLanguagePreference = usePlaylistStore((s) => s.setLanguagePreference);

  const languages = [
    { code: '', label: 'All Languages' },
    { code: 'English', label: 'English' },
    { code: 'Hindi', label: 'Hindi' },
    { code: 'Spanish', label: 'Spanish' },
    { code: 'French', label: 'French' },
    { code: 'German', label: 'German' },
    { code: 'Italian', label: 'Italian' },
    { code: 'Portuguese', label: 'Portuguese' },
    { code: 'Japanese', label: 'Japanese' },
    { code: 'Korean', label: 'Korean' },
    { code: 'Mandarin', label: 'Mandarin' },
    { code: 'Instrumental', label: 'Instrumental' },
  ];

  return (
    <div className="flex items-center gap-2.5">
      <label htmlFor="language-select" className="text-sm font-medium text-ink-soft">
        Language Preference:
      </label>
      <select
        id="language-select"
        value={languagePreference}
        onChange={(e) => setLanguagePreference(e.target.value)}
        className="rounded border border-line-strong bg-surface px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none"
      >
        {languages.map((l) => (
          <option key={l.code} value={l.code}>{l.label}</option>
        ))}
      </select>
    </div>
  );
};
