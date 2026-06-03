import { create } from 'zustand';

export type Theme = 'dark' | 'light';

const THEME_STORAGE_KEY = 'playlist-manager:theme';

const getInitialTheme = (): Theme => {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    /* ignore */
  }
  // Default: dark (glassmorphism reads strongest on dark backgrounds)
  return 'dark';
};

const applyTheme = (theme: Theme) => {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme);
  }
};

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>((set, get) => {
  const initial = getInitialTheme();
  applyTheme(initial);

  return {
    theme: initial,

    toggleTheme: () => {
      const next: Theme = get().theme === 'dark' ? 'light' : 'dark';
      get().setTheme(next);
    },

    setTheme: (theme: Theme) => {
      applyTheme(theme);
      try {
        localStorage.setItem(THEME_STORAGE_KEY, theme);
      } catch {
        /* ignore */
      }
      set({ theme });
    },
  };
});
