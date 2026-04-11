import React from 'react';
import { usePlaylistStore } from '../store';
import './components.css';

/**
 * LanguageSelector component - Interface for selecting language preference
 */
export const LanguageSelector: React.FC = () => {
  const { languagePreference, setLanguagePreference } = usePlaylistStore();

  const commonLanguages = [
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

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguagePreference(e.target.value);
  };

  return (
    <div className="language-selector">
      <label htmlFor="language-select">Language Preference:</label>
      <select
        id="language-select"
        value={languagePreference}
        onChange={handleLanguageChange}
        className="language-dropdown"
      >
        {commonLanguages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.label}
          </option>
        ))}
      </select>
    </div>
  );
};
