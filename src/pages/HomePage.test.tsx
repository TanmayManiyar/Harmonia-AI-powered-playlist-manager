import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HomePage } from './HomePage';
import { usePlaylistStore } from '../store';
import { useAuthStore } from '../store/authStore';

describe('HomePage', () => {
  beforeEach(() => {
    usePlaylistStore.setState({
      playlists: new Map(),
      languagePreference: 'en',
      isLoading: false,
      fetchPlaylists: async () => undefined,
    });
    useAuthStore.setState({
      isAuthenticated: true,
      user: { id: 'user-1', name: 'Test User', email: 'test@example.com' },
      token: 'test-token',
    });
  });

  it('should render the app header', () => {
    render(<HomePage />);

    expect(screen.getByText('Harmonia')).toBeInTheDocument();
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

  it('should render account controls', () => {
    render(<HomePage />);

    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('Sign Out')).toBeInTheDocument();
    expect(screen.getByText('Delete Account')).toBeInTheDocument();
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
    expect(container.querySelector('.toolbar')).toBeInTheDocument();
    expect(container.querySelector('.tab-nav')).toBeInTheDocument();
  });
});
