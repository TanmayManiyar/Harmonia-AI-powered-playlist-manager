import React, { useState } from 'react';
import {
  Music,
  Library,
  Heart,
  Music2,
  Plus,
  Search,
  Sparkles,
  LogOut,
  Trash2,
  Menu,
  X,
} from 'lucide-react';
import './layout.css';

export type ViewId = 'library' | 'favorites' | 'genres';
export type ActionId = 'create' | 'search' | 'ai';

interface SidebarProps {
  activeView: ViewId;
  onSelectView: (view: ViewId) => void;
  onOpenAction: (action: ActionId) => void;
  userName?: string;
  onLogout: () => void;
  onDeleteAccount: () => void;
}

const VIEWS: { id: ViewId; label: string; icon: React.ReactNode }[] = [
  { id: 'library', label: 'Library', icon: <Library size={20} /> },
  { id: 'favorites', label: 'Favorites', icon: <Heart size={20} /> },
  { id: 'genres', label: 'Genres', icon: <Music2 size={20} /> },
];

const ACTIONS: { id: ActionId; label: string; icon: React.ReactNode }[] = [
  { id: 'create', label: 'Create', icon: <Plus size={20} /> },
  { id: 'search', label: 'Search', icon: <Search size={20} /> },
  { id: 'ai', label: 'AI Chat', icon: <Sparkles size={20} /> },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onSelectView,
  onOpenAction,
  userName,
  onLogout,
  onDeleteAccount,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSelectView = (view: ViewId) => {
    onSelectView(view);
    setMobileOpen(false);
  };

  const handleOpenAction = (action: ActionId) => {
    onOpenAction(action);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile top bar with hamburger */}
      <div className="mobile-bar glass">
        <button
          className="mobile-menu-btn"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>
        <div className="mobile-brand">
          <Music size={20} className="brand-icon" />
          <span>Harmonia</span>
        </div>
      </div>

      {/* Backdrop for mobile drawer */}
      {mobileOpen && (
        <div className="sidebar-backdrop" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={`sidebar glass ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="brand">
            <span className="brand-logo">
              <Music size={22} strokeWidth={2.5} />
            </span>
            <div className="brand-text">
              <h1>Harmonia</h1>
              <p>Your music, organized</p>
            </div>
          </div>
          <button
            className="sidebar-close"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <span className="nav-label">Views</span>
          {VIEWS.map((view) => (
            <button
              key={view.id}
              className={`nav-item ${activeView === view.id ? 'active' : ''}`}
              onClick={() => handleSelectView(view.id)}
            >
              <span className="nav-icon">{view.icon}</span>
              {view.label}
            </button>
          ))}

          <span className="nav-label">Actions</span>
          {ACTIONS.map((action) => (
            <button
              key={action.id}
              className={`nav-item ${action.id === 'ai' ? 'nav-item--ai' : ''}`}
              onClick={() => handleOpenAction(action.id)}
            >
              <span className="nav-icon">{action.icon}</span>
              {action.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          {userName && (
            <div className="sidebar-user">
              <div className="user-avatar">{userName.charAt(0).toUpperCase()}</div>
              <span className="user-name">{userName}</span>
            </div>
          )}
          <button className="footer-btn" onClick={onLogout}>
            <LogOut size={18} />
            Sign Out
          </button>
          <button className="footer-btn footer-btn--danger" onClick={onDeleteAccount}>
            <Trash2 size={18} />
            Delete Account
          </button>
        </div>
      </aside>
    </>
  );
};
