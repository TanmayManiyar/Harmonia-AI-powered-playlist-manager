import React, { useState } from 'react';
import { Music } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Blobs } from '../components/Blobs';
import { ThemeToggle } from '../components/ThemeToggle';
import './LoginPage.css';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);

  const login = useAuthStore((state) => state.login);
  const register = useAuthStore((state) => state.register);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const result = isRegister
      ? await register(email, password)
      : await login(email, password);

    if (!result.success) {
      setError(result.error || 'Authentication failed');
    }

    setIsLoading(false);
  };

  return (
    <div className="login-page">
      <Blobs />

      <div className="login-container">
        <div className="login-card glass">
          <div className="login-logo">
            <span className="login-logo-icon">
              <Music size={30} strokeWidth={2.5} />
            </span>
            <h1>Harmonia</h1>
            <p>{isRegister ? 'Create your account' : 'Sign in to manage your playlists'}</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="login-field">
              <label htmlFor="login-email">Email</label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                autoFocus
              />
            </div>

            <div className="login-field">
              <label htmlFor="login-password">Password</label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete={isRegister ? 'new-password' : 'current-password'}
              />
            </div>

            {error && <div className="login-error">{error}</div>}

            <button
              type="submit"
              className="login-submit"
              disabled={isLoading}
            >
              {isLoading
                ? (isRegister ? 'Creating account...' : 'Signing in...')
                : (isRegister ? 'Create Account' : 'Sign In')
              }
            </button>
          </form>

          <div className="login-footer">
            <button
              className="login-toggle"
              onClick={() => { setIsRegister(!isRegister); setError(null); }}
              type="button"
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
