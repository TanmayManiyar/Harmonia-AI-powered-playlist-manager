import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { ThemeToggle } from '../components/ThemeToggle';
import { Button } from '../components/ui/button';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);

  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    const result = isRegister ? await register(email, password) : await login(email, password);
    if (!result.success) setError(result.error || 'Authentication failed');
    setIsLoading(false);
  };

  const field =
    'w-full rounded border border-line-strong bg-surface px-3.5 py-3 text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-none';

  return (
    <div className="grid min-h-screen place-items-center bg-paper px-5">
      <div className="w-full max-w-[400px]">
        {/* Brand */}
        <div className="mb-8 text-center">
          <span className="mb-4 inline-grid h-12 w-12 place-items-center rounded-md bg-accent font-display text-xl font-bold text-accent-contrast">
            H
          </span>
          <h1 className="font-display text-4xl font-semibold tracking-tight text-ink">Harmonia</h1>
          <p className="mt-1.5 text-sm text-muted">
            {isRegister ? 'Create your account' : 'Sign in to manage your playlists'}
          </p>
        </div>

        <div className="rounded-lg border border-line bg-surface p-8 shadow-[var(--shadow)]">
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="login-email" className="text-xs font-medium text-ink-soft">Email</label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                autoFocus
                className={field}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="login-password" className="text-xs font-medium text-ink-soft">Password</label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                className={field}
              />
            </div>

            {error && (
              <div className="rounded border border-danger/40 px-3 py-2 text-sm text-danger">{error}</div>
            )}

            <Button type="submit" variant="accent" size="lg" disabled={isLoading} className="mt-1 w-full">
              {isLoading
                ? isRegister ? 'Creating account…' : 'Signing in…'
                : isRegister ? 'Create Account' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-5 text-center">
            <button
              type="button"
              onClick={() => { setIsRegister(!isRegister); setError(null); }}
              className="text-sm font-medium text-ink-soft transition-colors hover:text-accent-ink"
            >
              {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Register"}
            </button>
          </div>
        </div>
      </div>

      <ThemeToggle />
    </div>
  );
};
