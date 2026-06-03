import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { useAuthModalStore } from '../store/authModalStore';
import { useAuthStore } from '../store/authStore';
import { Button } from './ui/button';

const REDIRECT_KEY = 'playlist-manager:redirect';

/**
 * AuthModal — a crisp, square, blurred-backdrop login/register popup.
 * Email/password works now; Google is presented as "coming soon".
 */
export const AuthModal: React.FC = () => {
  const isOpen = useAuthModalStore((s) => s.isOpen);
  const mode = useAuthModalStore((s) => s.mode);
  const close = useAuthModalStore((s) => s.close);
  const setMode = useAuthModalStore((s) => s.setMode);

  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen, close]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = mode === 'register' ? await register(email, password) : await login(email, password);
    setLoading(false);
    if (!result.success) {
      setError(result.error || 'Authentication failed');
      return;
    }
    close();
    setEmail('');
    setPassword('');
    try {
      const dest = sessionStorage.getItem(REDIRECT_KEY);
      if (dest) {
        sessionStorage.removeItem(REDIRECT_KEY);
        navigate(dest, { replace: true });
      }
    } catch {
      /* ignore */
    }
  };

  const field =
    'w-full rounded-md border border-line-strong bg-paper px-3.5 py-3 text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-none';

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[130] grid place-items-center p-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={close}
        >
          <div className="absolute inset-0 bg-ink/50 backdrop-blur-md" />
          <motion.div
            className="relative w-full max-w-[400px] overflow-hidden rounded-2xl border border-line bg-surface p-8 shadow-[var(--shadow-lg)]"
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <button
              onClick={close}
              aria-label="Close"
              className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full text-muted transition-colors hover:bg-paper-2 hover:text-ink"
            >
              <X size={18} />
            </button>

            <div className="mb-6 text-center">
              <span className="mb-3 inline-grid h-11 w-11 place-items-center rounded-md bg-accent font-display text-lg font-bold text-accent-contrast">
                H
              </span>
              <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">
                {mode === 'register' ? 'Create your account' : 'Welcome back'}
              </h2>
              <p className="mt-1 text-sm text-muted">
                {mode === 'register' ? 'Start composing your library' : 'Sign in to continue'}
              </p>
            </div>

            {/* Google — coming soon */}
            <button
              type="button"
              disabled
              title="Google sign-in is coming soon"
              className="flex w-full items-center justify-center gap-2.5 rounded-md border border-line bg-paper px-4 py-3 text-sm font-medium text-muted"
            >
              <GoogleMark />
              Continue with Google
              <span className="rounded-full border border-line px-1.5 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide">
                Soon
              </span>
            </button>

            <div className="my-5 flex items-center gap-3 text-xs text-muted">
              <span className="h-px flex-1 bg-line" />
              or
              <span className="h-px flex-1 bg-line" />
            </div>

            <form className="flex flex-col gap-3.5" onSubmit={handleSubmit}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                autoFocus
                className={field}
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                className={field}
              />
              {error && <div className="rounded-md border border-danger/40 px-3 py-2 text-sm text-danger">{error}</div>}
              <Button type="submit" variant="accent" size="lg" disabled={loading} className="mt-1 w-full">
                {loading
                  ? mode === 'register' ? 'Creating…' : 'Signing in…'
                  : mode === 'register' ? 'Create account' : 'Sign in'}
              </Button>
            </form>

            <p className="mt-5 text-center text-sm text-muted">
              {mode === 'register' ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                type="button"
                onClick={() => { setMode(mode === 'register' ? 'login' : 'register'); setError(null); }}
                className="font-medium text-accent-ink hover:underline"
              >
                {mode === 'register' ? 'Sign in' : 'Create one'}
              </button>
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

const GoogleMark: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </svg>
);
