import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';
import './layout.css';

/**
 * ThemeToggle — a floating glass pill pinned to the bottom-right of the
 * viewport. One tap flips between dark and light. Always visible.
 */
export const ThemeToggle: React.FC = () => {
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);

  const isDark = theme === 'dark';

  return (
    <button
      className="theme-toggle glass"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Light mode' : 'Dark mode'}
    >
      <span className={`theme-toggle-icon ${isDark ? 'show' : 'hide'}`}>
        <Moon size={20} strokeWidth={2} />
      </span>
      <span className={`theme-toggle-icon ${isDark ? 'hide' : 'show'}`}>
        <Sun size={20} strokeWidth={2} />
      </span>
    </button>
  );
};
