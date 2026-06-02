import { create } from 'zustand';
import { api } from '../services/api';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  deleteAccount: () => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  restoreSession: () => Promise<void>;
}

const AUTH_STORAGE_KEY = 'playlist-manager:auth';

const loadStoredAuth = (): { token: string | null; user: User | null } => {
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed?.token && parsed?.user) {
        return { token: parsed.token, user: parsed.user };
      }
    }
    } catch {
      return { token: null, user: null };
    }
  return { token: null, user: null };
};

const saveAuth = (token: string, user: User) => {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ token, user }));
};

const clearAuth = () => {
  localStorage.removeItem(AUTH_STORAGE_KEY);
};

export const useAuthStore = create<AuthState>((set) => {
  const stored = loadStoredAuth();

  return {
    isAuthenticated: !!stored.token,
    user: stored.user,
    token: stored.token,

    login: async (email: string, password: string) => {
      try {
        const data = await api.login(email, password);
        saveAuth(data.token, data.user);
        set({ isAuthenticated: true, user: data.user, token: data.token });
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message || 'Login failed' };
      }
    },

    register: async (email: string, password: string) => {
      try {
        const data = await api.register(email, password);
        saveAuth(data.token, data.user);
        set({ isAuthenticated: true, user: data.user, token: data.token });
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message || 'Registration failed' };
      }
    },

    deleteAccount: async () => {
      try {
        await api.deleteAccount();
        clearAuth();
        set({ isAuthenticated: false, user: null, token: null });
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message || 'Failed to delete account' };
      }
    },

    logout: () => {
      clearAuth();
      set({ isAuthenticated: false, user: null, token: null });
    },

    restoreSession: async () => {
      const stored = loadStoredAuth();
      if (!stored.token) return;

      try {
        const data = await api.getMe();
        set({ isAuthenticated: true, user: data.user, token: stored.token });
      } catch {
        // Token invalid, clear
        clearAuth();
        set({ isAuthenticated: false, user: null, token: null });
      }
    },
  };
});
