import React, { useState, useEffect } from 'react';
import { Sidebar, ViewId, ActionId } from '../components/Sidebar';
import {
  HomeView,
  MyPlaylistsSection,
  FavoritesSection,
  GenreSection,
  PlaylistCreationPanel,
  SearchPanel,
  AIChatPanel,
  VenuesPanel,
  CommandPalette,
  ConfirmationDialog,
  Modal,
  ThemeToggle,
} from '../components';
import { RippleDots } from '../components/RippleDots';
import { OnboardingModal, ONBOARDED_KEY } from '../components/OnboardingModal';
import { PlayerHost } from '../components/player/PlayerHost';
import { PlayerBar } from '../components/player/PlayerBar';
import { NowPlayingPanel } from '../components/player/NowPlayingPanel';
import { useAuthStore } from '../store/authStore';
import { usePlaylistStore } from '../store';
import { useMediaKeys } from '../hooks/useMediaKeys';

export const HomePage: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewId>('home');
  const [activeAction, setActiveAction] = useState<ActionId | null>(null);

  const [showOnboarding, setShowOnboarding] = useState(() => {
    try {
      return !localStorage.getItem(ONBOARDED_KEY);
    } catch {
      return false;
    }
  });
  const [showDeleteStep1, setShowDeleteStep1] = useState(false);
  const [showDeleteStep2, setShowDeleteStep2] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const deleteAccount = useAuthStore((s) => s.deleteAccount);
  const fetchPlaylists = usePlaylistStore((s) => s.fetchPlaylists);

  useMediaKeys();

  useEffect(() => {
    fetchPlaylists();
  }, [fetchPlaylists]);

  const handleStep2Confirm = async () => {
    setIsDeleting(true);
    setDeleteError('');
    const result = await deleteAccount();
    setIsDeleting(false);
    if (!result.success) {
      setDeleteError(result.error || 'Failed to delete account');
      setShowDeleteStep2(false);
    }
  };

  const closeDelete = () => {
    setShowDeleteStep1(false);
    setShowDeleteStep2(false);
    setDeleteError('');
  };

  return (
    <div className="home-page min-h-screen bg-paper">
      <Sidebar
        activeView={activeView}
        onSelectView={setActiveView}
        onOpenAction={setActiveAction}
        userName={user?.name ?? ''}
        onLogout={logout}
        onDeleteAccount={() => { setDeleteError(''); setShowDeleteStep1(true); }}
      />

      {/* Decorative diagonal ripple covering ~the upper-right half, behind content */}
      <div className="pointer-events-none fixed -right-4 top-12 z-0 hidden -rotate-12 opacity-70 lg:block">
        <RippleDots rows={15} cols={22} />
      </div>

      <main className="canvas relative z-10 px-5 pb-24 pt-20 lg:ml-64 lg:px-10 lg:pt-10">
        <div key={activeView} className="mx-auto max-w-[1180px] motion-safe:animate-[fadeIn_.28s_ease-out]">
          {activeView === 'home' && <HomeView userName={user?.name ?? ''} />}
          {activeView === 'library' && <MyPlaylistsSection />}
          {activeView === 'favorites' && <FavoritesSection />}
          {activeView === 'genres' && <GenreSection />}
        </div>
      </main>

      <Modal isOpen={activeAction === 'create'} onClose={() => setActiveAction(null)} title="Create Playlist">
        <PlaylistCreationPanel />
      </Modal>
      <Modal isOpen={activeAction === 'venues'} onClose={() => setActiveAction(null)} title="Venue Playlists" size="lg">
        <VenuesPanel />
      </Modal>
      <Modal isOpen={activeAction === 'search'} onClose={() => setActiveAction(null)} title="Search & Browse 🔎" size="lg">
        <SearchPanel />
      </Modal>
      <Modal isOpen={activeAction === 'ai'} onClose={() => setActiveAction(null)} size="lg">
        <AIChatPanel />
      </Modal>

      {deleteError && (
        <div
          className="fixed bottom-6 left-1/2 z-[90] -translate-x-1/2 cursor-pointer rounded-md border border-danger/40 bg-surface px-5 py-3 text-sm font-medium text-danger shadow-[var(--shadow-lg)]"
          onClick={() => setDeleteError('')}
        >
          {deleteError}
        </div>
      )}

      <ConfirmationDialog
        isOpen={showDeleteStep1}
        message="Are you sure you want to delete your account? This will permanently remove your account and ALL your playlists from Harmonia. This action cannot be undone."
        onConfirm={() => { setShowDeleteStep1(false); setShowDeleteStep2(true); }}
        onCancel={closeDelete}
        confirmText="Yes, I want to delete"
        cancelText="Cancel"
      />
      <ConfirmationDialog
        isOpen={showDeleteStep2}
        message={`FINAL WARNING: This is your last chance. Your account "${user?.name}" and all associated data will be permanently deleted. Are you absolutely sure?`}
        onConfirm={handleStep2Confirm}
        onCancel={closeDelete}
        confirmText={isDeleting ? 'Deleting…' : 'Delete permanently'}
        cancelText="No, keep my account"
      />

      <CommandPalette onSelectView={setActiveView} onOpenAction={setActiveAction} />

      <OnboardingModal isOpen={showOnboarding} onDone={() => setShowOnboarding(false)} />

      <PlayerHost />
      <PlayerBar inset />
      <NowPlayingPanel />
      <ThemeToggle />
    </div>
  );
};
