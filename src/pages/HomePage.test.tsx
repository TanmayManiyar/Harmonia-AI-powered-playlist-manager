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

  it('should render the brand', () => {
    render(<HomePage />);
    // Appears in both the sidebar header and the mobile bar
    expect(screen.getAllByText('Harmonia').length).toBeGreaterThan(0);
  });

  it('should render the view navigation', () => {
    render(<HomePage />);

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Library')).toBeInTheDocument();
    expect(screen.getByText('Favorites')).toBeInTheDocument();
    expect(screen.getByText('Genres')).toBeInTheDocument();
  });

  it('should render the create actions', () => {
    render(<HomePage />);

    expect(screen.getByText('Create')).toBeInTheDocument();
    expect(screen.getByText('Search')).toBeInTheDocument();
    expect(screen.getByText('AI Chat')).toBeInTheDocument();
  });

  it('should render account controls', () => {
    render(<HomePage />);

    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('Sign Out')).toBeInTheDocument();
    expect(screen.getByText('Delete Account')).toBeInTheDocument();
  });

  it('should default to the home view', () => {
    render(<HomePage />);
    // Empty library on the home view shows its prompt
    expect(screen.getByText(/ghost town/i)).toBeInTheDocument();
  });

  it('should have the core layout structure', () => {
    const { container } = render(<HomePage />);

    expect(container.querySelector('.home-page')).toBeInTheDocument();
    expect(container.querySelector('.sidebar')).toBeInTheDocument();
    expect(container.querySelector('.canvas')).toBeInTheDocument();
  });
});
