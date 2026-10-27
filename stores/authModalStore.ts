// stores/authModalStore.ts
// One global auth dialog for the whole app. Any surface (navbar, guard, order
// page, a redirect from the proxy) opens the same modal instead of navigating
// to a separate /login or /register page.

import { create } from 'zustand';

export type AuthView = 'login' | 'register';
export type AuthNotice = 'registered' | 'confirm' | 'signed-out' | 'session-expired' | null;

interface OpenAuthOptions {
  view?: AuthView;
  notice?: AuthNotice;
  /** Pre-fills the sign-in email field (after registration, or from a redirect). */
  email?: string;
  /** Where to send the user once they are signed in. */
  redirectTo?: string;
}

interface AuthModalState {
  open: boolean;
  view: AuthView;
  notice: AuthNotice;
  email: string;
  redirectTo: string;
  openAuth: (options?: OpenAuthOptions) => void;
  closeAuth: () => void;
  setView: (view: AuthView) => void;
  clearNotice: () => void;
}

export const useAuthModal = create<AuthModalState>((set) => ({
  open: false,
  view: 'login',
  notice: null,
  email: '',
  redirectTo: '/',
  openAuth: (options = {}) =>
    set((state) => ({
      open: true,
      view: options.view ?? state.view,
      notice: options.notice ?? null,
      email: options.email ?? '',
      // Keep an already-planned destination (e.g. /orders after a proxy redirect)
      // when a view swap does not specify one.
      redirectTo: options.redirectTo ?? state.redirectTo,
    })),
  closeAuth: () => set({ open: false, notice: null, email: '' }),
  setView: (view) => set({ view, notice: null }),
  clearNotice: () => set({ notice: null }),
}));

/** Convenience for non-React call sites. */
export function openAuthModal(options?: OpenAuthOptions) {
  useAuthModal.getState().openAuth(options);
}
