import React, { useState, useEffect } from 'react';
import {
  Sidebar,
  ViewId,
  ActionId,
} from '../components/Sidebar';
import {
  MyPlaylistsSection,
  FavoritesSection,
  GenreSection,
  PlaylistCreationPanel,
  SearchPanel,
  AIChatPanel,
  ConfirmationDialog,
  Modal,
  Blobs,
  ThemeToggle,
} from '../components';
import { useAuthStore } from '../store/authStore';
import { usePlaylistStore } from '../store';
import './HomePage.css';

export const HomePage: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewId>('library');
  const [activeAction, setActiveAction] = useState<ActionId | null>(null);

  // Delete account — two-step confirmation
  const [showDeleteStep1, setShowDeleteStep1] = useState(false);
  const [showDeleteStep2, setShowDeleteStep2] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const deleteAccount = useAuthStore((state) => state.deleteAccount);
  const fetchPlaylists = usePlaylistStore((state) => state.fetchPlaylists);

  useEffect(() => {
    fetchPlaylists();
  }, [fetchPlaylists]);

  const handleDeleteAccountClick = () => {
    setDeleteError('');
    setShowDeleteStep1(true);
  };

  const handleStep1Confirm = () => {
    setShowDeleteStep1(false);
    setShowDeleteStep2(true);
  };

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

  const handleCancelDelete = () => {
    setShowDeleteStep1(false);
    setShowDeleteStep2(false);
    setDeleteError('');
  };

  return (
    <div className="home-page">
      <Blobs />

      <Sidebar
        activeView={activeView}
        onSelectView={setActiveView}
        onOpenAction={setActiveAction}
        userName={user?.name ?? ''}
        onLogout={logout}
        onDeleteAccount={handleDeleteAccountClick}
      />

      <main className="canvas">
        <div className="canvas-inner fade-in" key={activeView}>
          {activeView === 'library' && <MyPlaylistsSection />}
          {activeView === 'favorites' && <FavoritesSection />}
          {activeView === 'genres' && <GenreSection />}
        </div>
      </main>

      {/* Action modals */}
      <Modal
        isOpen={activeAction === 'create'}
        onClose={() => setActiveAction(null)}
        title="Create Playlist"
      >
        <PlaylistCreationPanel />
      </Modal>

      <Modal
        isOpen={activeAction === 'search'}
        onClose={() => setActiveAction(null)}
        title="Search Songs"
      >
        <SearchPanel />
      </Modal>

      <Modal
        isOpen={activeAction === 'ai'}
        onClose={() => setActiveAction(null)}
        size="lg"
      >
        <AIChatPanel />
      </Modal>

      {/* Delete error toast */}
      {deleteError && (
        <div className="delete-error-toast glass" onClick={() => setDeleteError('')}>
          ⚠️ {deleteError}
        </div>
      )}

      {/* Step 1: Initial confirmation */}
      <ConfirmationDialog
        isOpen={showDeleteStep1}
        message="Are you sure you want to delete your account? This will permanently remove your account and ALL your playlists from Harmonia. This action cannot be undone."
        onConfirm={handleStep1Confirm}
        onCancel={handleCancelDelete}
        confirmText="Yes, I want to delete"
        cancelText="Cancel"
      />

      {/* Step 2: Final confirmation */}
      <ConfirmationDialog
        isOpen={showDeleteStep2}
        message={`FINAL WARNING: This is your last chance. Your account "${user?.name}" and all associated data will be permanently deleted. Are you absolutely sure?`}
        onConfirm={handleStep2Confirm}
        onCancel={handleCancelDelete}
        confirmText={isDeleting ? 'Deleting...' : 'Delete permanently'}
        cancelText="No, keep my account"
      />

      <ThemeToggle />
    </div>
  );
};
