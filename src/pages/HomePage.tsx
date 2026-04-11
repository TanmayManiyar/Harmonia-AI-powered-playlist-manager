import React, { useState, useEffect } from 'react';
import {
  PlaylistCreationPanel,
  SearchPanel,
  MyPlaylistsSection,
  FavoritesSection,
  GenreSection,
  AIChatPanel,
} from '../components';
import { useAuthStore } from '../store/authStore';
import { usePlaylistStore } from '../store';
import './HomePage.css';

export const HomePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'favorites' | 'genres'>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);

  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const fetchPlaylists = usePlaylistStore((state) => state.fetchPlaylists);

  useEffect(() => {
    fetchPlaylists();
  }, [fetchPlaylists]);

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
    </div>
  );
};
