import { create } from 'zustand';

type Mode = 'login' | 'register';

interface AuthModalState {
  isOpen: boolean;
  mode: Mode;
  open: (mode?: Mode) => void;
  close: () => void;
  setMode: (mode: Mode) => void;
}

/** Controls the global login/register popup, openable from anywhere. */
export const useAuthModalStore = create<AuthModalState>((set) => ({
  isOpen: false,
  mode: 'login',
  open: (mode = 'login') => set({ isOpen: true, mode }),
  close: () => set({ isOpen: false }),
  setMode: (mode) => set({ mode }),
}));
