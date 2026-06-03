import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  House,
  Library,
  Heart,
  Disc3,
  Plus,
  Search,
  Sparkles,
  Store,
  LogOut,
  Trash2,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '../lib/utils';

export type ViewId = 'home' | 'library' | 'favorites' | 'genres';
export type ActionId = 'create' | 'search' | 'ai' | 'venues';

interface SidebarProps {
  activeView: ViewId;
  onSelectView: (view: ViewId) => void;
  onOpenAction: (action: ActionId) => void;
  userName?: string;
  onLogout: () => void;
  onDeleteAccount: () => void;
}

const VIEWS: { id: ViewId; label: string; icon: React.ReactNode }[] = [
  { id: 'home', label: 'Home', icon: <House size={18} /> },
  { id: 'library', label: 'Library', icon: <Library size={18} /> },
  { id: 'favorites', label: 'Favorites', icon: <Heart size={18} /> },
  { id: 'genres', label: 'Genres', icon: <Disc3 size={18} /> },
];

const ACTIONS: { id: ActionId; label: string; icon: React.ReactNode }[] = [
  { id: 'create', label: 'Create', icon: <Plus size={18} /> },
  { id: 'venues', label: 'Venues', icon: <Store size={18} /> },
  { id: 'search', label: 'Search', icon: <Search size={18} /> },
  { id: 'ai', label: 'AI Chat', icon: <Sparkles size={18} /> },
];

const navItemClass = (active: boolean) =>
  cn(
    'group flex w-full items-center gap-3 rounded px-3 py-2 text-sm font-medium transition-colors',
    active
      ? 'bg-paper-2 text-ink'
      : 'text-ink-soft hover:bg-paper-2 hover:text-ink'
  );

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onSelectView,
  onOpenAction,
  userName,
  onLogout,
  onDeleteAccount,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const content = (
    <>
      <div className="flex items-center justify-between px-2 pb-6">
        <button
          onClick={() => { onSelectView('home'); setMobileOpen(false); }}
          className="flex items-center gap-2.5"
          aria-label="Go to home"
        >
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent font-display text-base font-bold text-accent-contrast">
            H
          </span>
          <span className="font-display text-lg font-bold tracking-tight text-ink">
            Harmonia
          </span>
        </button>
        <button
          className="grid h-8 w-8 place-items-center rounded text-muted hover:bg-paper-2 hover:text-ink lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto">
        <span className="px-3 pb-1.5 pt-2 text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-muted">
          Browse
        </span>
        {VIEWS.map((v) => (
          <button
            key={v.id}
            className={navItemClass(activeView === v.id)}
            onClick={() => {
              onSelectView(v.id);
              setMobileOpen(false);
            }}
          >
            <span className={cn(activeView === v.id ? 'text-accent-ink' : 'text-muted group-hover:text-ink-soft')}>
              {v.icon}
            </span>
            {v.label}
          </button>
        ))}

        <span className="px-3 pb-1.5 pt-5 text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-muted">
          Actions
        </span>
        {ACTIONS.map((a) => (
          <button
            key={a.id}
            className={navItemClass(false)}
            onClick={() => {
              onOpenAction(a.id);
              setMobileOpen(false);
            }}
          >
            <span className="text-muted group-hover:text-ink-soft">{a.icon}</span>
            {a.label}
          </button>
        ))}
      </nav>

      <div className="mt-4 border-t border-line pt-3">
        {userName && (
          <div className="flex items-center gap-2.5 px-3 py-2">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-accent text-xs font-semibold text-accent-contrast">
              {userName.charAt(0).toUpperCase()}
            </span>
            <span className="truncate text-sm font-medium text-ink">{userName}</span>
          </div>
        )}
        <button
          className="flex w-full items-center gap-3 rounded px-3 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-paper-2 hover:text-ink"
          onClick={onLogout}
        >
          <LogOut size={17} className="text-muted" />
          Sign Out
        </button>
        <button
          className="flex w-full items-center gap-3 rounded px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-danger/10 hover:text-danger"
          onClick={onDeleteAccount}
        >
          <Trash2 size={17} />
          Delete Account
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-40 flex items-center gap-3 border-b border-line bg-paper/90 px-4 py-3 backdrop-blur lg:hidden">
        <button
          className="grid h-9 w-9 place-items-center rounded text-ink hover:bg-paper-2"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <span className="font-display text-base font-semibold text-ink">Harmonia</span>
      </div>

      {/* Desktop rail */}
      <aside className="sidebar fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-paper px-3 py-5 lg:flex">
        {content}
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-ink/30 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              className="sidebar fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-line bg-paper px-3 py-5 lg:hidden"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            >
              {content}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
