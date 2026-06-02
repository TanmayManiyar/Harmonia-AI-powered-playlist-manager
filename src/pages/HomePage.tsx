import React, { useState, useEffect } from 'react';
import {
  PlaylistCreationPanel,
  SearchPanel,
  MyPlaylistsSection,
  FavoritesSection,
  GenreSection,
  AIChatPanel,
  ConfirmationDialog,
} from '../components';
import { useAuthStore } from '../store/authStore';
import { usePlaylistStore } from '../store';
import './HomePage.css';

export const HomePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'favorites' | 'genres'>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);

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
    // On success, the store resets auth state and the app will redirect to login
  };

  const handleCancelDelete = () => {
    setShowDeleteStep1(false);
    setShowDeleteStep2(false);
    setDeleteError('');
  };

  return (
    <div className="home-page">
      {/* Animated Background */}
      <div className="bg-gradient"></div>
      <div className="bg-pattern"></div>

      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo-icon">🎵</div>
            <div>
              <h1 className="app-title">Harmonia</h1>
              <p className="app-subtitle">Your music, perfectly organized</p>
            </div>
          </div>
          <div className="header-right">
            <div className="user-area">
              {user && <span className="user-name">{user.name}</span>}
              <button className="signout-button" onClick={logout}>
                Sign Out
              </button>
              <button className="delete-account-button" onClick={handleDeleteAccountClick}>
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="app-container">
        {/* Action Buttons */}
        <div className="toolbar">
          <button
            className={`toolbar-btn ${showCreate ? 'active' : ''}`}
            onClick={() => { setShowCreate(!showCreate); setShowSearch(false); setShowAIChat(false); }}
          >
            <span className="toolbar-icon">＋</span>
            Create Playlist
          </button>
          <button
            className={`toolbar-btn ${showSearch ? 'active' : ''}`}
            onClick={() => { setShowSearch(!showSearch); setShowCreate(false); setShowAIChat(false); }}
          >
            <span className="toolbar-icon">🔍</span>
            Search Songs
          </button>
          <button
            className={`toolbar-btn ai-btn ${showAIChat ? 'active' : ''}`}
            onClick={() => { setShowAIChat(!showAIChat); setShowCreate(false); setShowSearch(false); }}
          >
            <span className="toolbar-icon">✨</span>
            AI Chat
          </button>
        </div>

        {/* Expandable Panels */}
        {showCreate && (
          <div className="panel-wrapper fade-in">
            <PlaylistCreationPanel />
          </div>
        )}
        {showSearch && (
          <div className="panel-wrapper fade-in">
            <SearchPanel />
          </div>
        )}
        {showAIChat && (
          <div className="panel-wrapper ai-panel-wrapper fade-in">
            <AIChatPanel />
          </div>
        )}

        {/* Tab Navigation */}
        <nav className="tab-nav">
          <button
            className={`tab-item ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            <span className="tab-icon">📚</span>
            All Playlists
          </button>
          <button
            className={`tab-item ${activeTab === 'favorites' ? 'active' : ''}`}
            onClick={() => setActiveTab('favorites')}
          >
            <span className="tab-icon">⭐</span>
            Favorites
          </button>
          <button
            className={`tab-item ${activeTab === 'genres' ? 'active' : ''}`}
            onClick={() => setActiveTab('genres')}
          >
            <span className="tab-icon">🎸</span>
            By Genre
          </button>
        </nav>

        {/* Main Content Area */}
        <main className="content-area">
          {activeTab === 'all' && <MyPlaylistsSection />}
          {activeTab === 'favorites' && <FavoritesSection />}
          {activeTab === 'genres' && <GenreSection />}
        </main>
      </div>

      {/* Delete error toast */}
      {deleteError && (
        <div className="delete-error-toast" onClick={() => setDeleteError('')}>
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
        message={`⚠️ FINAL WARNING: This is your last chance. Your account "${user?.name}" and all associated data will be permanently deleted. Are you absolutely sure?`}
        onConfirm={handleStep2Confirm}
        onCancel={handleCancelDelete}
        confirmText={isDeleting ? "Deleting..." : "Delete permanently"}
        cancelText="No, keep my account"
      />
    </div>
  );
};

