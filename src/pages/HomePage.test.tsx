import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HomePage } from './HomePage';
import { usePlaylistStore } from '../store';

describe('HomePage', () => {
  beforeEach(() => {
    // Reset store before each test
    const store = usePlaylistStore.getState();
    store.playlists.forEach((_, id) => {
      store.deletePlaylist(id);
    });
  });

  it('should render the app header', () => {
    render(<HomePage />);

    expect(screen.getByText('Playlist Manager')).toBeInTheDocument();
    expect(screen.getByText(/Your music, perfectly organized/)).toBeInTheDocument();
  });

  it('should render all main sections', () => {
    render(<HomePage />);

    // Check for navigation items
    expect(screen.getByText('All Playlists')).toBeInTheDocument();
    expect(screen.getByText('Favorites')).toBeInTheDocument();
    expect(screen.getByText('By Genre')).toBeInTheDocument();
  });

  it('should render playlist creation controls', () => {
    render(<HomePage />);

    expect(screen.getByText('Create Playlist')).toBeInTheDocument();
  });

  it('should render language selector', () => {
    render(<HomePage />);

    expect(screen.getByText('Language Preference:')).toBeInTheDocument();
  });

  it('should render search panel', () => {
    render(<HomePage />);

    expect(screen.getByText('Search Songs')).toBeInTheDocument();
  });

  it('should have responsive layout structure', () => {
    const { container } = render(<HomePage />);

    expect(container.querySelector('.home-page')).toBeInTheDocument();
    expect(container.querySelector('.app-header')).toBeInTheDocument();
    expect(container.querySelector('.app-container')).toBeInTheDocument();
    expect(container.querySelector('.main-layout')).toBeInTheDocument();
    expect(container.querySelector('.sidebar-nav')).toBeInTheDocument();
  });
});
