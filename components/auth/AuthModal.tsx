// components/auth/AuthModal.tsx
// The only sign-in / create-account surface in the app. Controlled by
// stores/authModalStore so any component can open it; no /login page exists.

'use client';

import { useCallback, useEffect, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { X } from 'lucide-react';

import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { useAuth } from '@/hooks/useAuth';
import { useAuthModal, type AuthNotice, type AuthView } from '@/stores/authModalStore';

const NOTICE_COPY: Record<Exclude<AuthNotice, null>, { title: string; body?: string }> = {
  registered: {
    title: 'Account created — sign in to continue.',
    body: 'Use the email and password you just chose.',
  },
  confirm: {
    title: 'Almost there — confirm your email.',
    body: 'We sent a confirmation link to your inbox. Click it, then sign in below. Check spam if it has not arrived in a minute.',
  },
  'signed-out': {
    title: 'You have been signed out.',
  },
  'session-expired': {
    title: 'Your session expired.',
    body: 'Please sign in again to continue.',
  },
};

export function AuthModal() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { isAuthenticated, isLoading } = useAuth();
  const { open, view, notice, email, redirectTo, closeAuth, setView } = useAuthModal();

  const panelRef = useRef<HTMLDivElement>(null);
  const consumedQuery = useRef(false);

  // Deep links: /?auth=login|register&redirect=/orders (used by the proxy when a
  // protected page is opened while signed out, and by old /login bookmarks).
  useEffect(() => {
    if (consumedQuery.current) return;
    if (isLoading) return;
    if (isAuthenticated) return;

    const requested = searchParams.get('auth');
    if (requested !== 'login' && requested !== 'register') return;

    consumedQuery.current = true;

    const registered = searchParams.get('registered') === '1';
    const confirm = searchParams.get('confirm') === '1';
    const signedOut = searchParams.get('signedOut') === '1';

    useAuthModal.getState().openAuth({
      view: requested,
      email: searchParams.get('email') ?? '',
      redirectTo: searchParams.get('redirect') ?? pathname ?? '/',
      notice: registered ? (confirm ? 'confirm' : 'registered') : signedOut ? 'signed-out' : null,
    });

    // Strip the auth params so a refresh or back-navigation does not reopen it.
    const next = new URLSearchParams(searchParams.toString());
    ['auth', 'registered', 'confirm', 'signedOut', 'email', 'redirect'].forEach((key) =>
      next.delete(key)
    );
    const query = next.toString();
    window.history.replaceState(null, '', `${pathname}${query ? `?${query}` : ''}`);
  }, [isLoading, isAuthenticated, searchParams, pathname]);

  // Already signed in (e.g. another tab): the dialog has nothing to do.
  useEffect(() => {
    if (open && isAuthenticated) closeAuth();
  }, [open, isAuthenticated, closeAuth]);

  // Scroll lock + Escape close.
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeAuth();
    };
    document.addEventListener('keydown', onKeyDown);

    const focusTimer = window.setTimeout(() => panelRef.current?.focus(), 40);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
      window.clearTimeout(focusTimer);
    };
  }, [open, closeAuth]);

  const handleSignedIn = useCallback(() => {
    const target = redirectTo && redirectTo.startsWith('/') ? redirectTo : '/';
    closeAuth();
    router.push(target);
    router.refresh();
  }, [closeAuth, redirectTo, router]);

  const switchView = useCallback(
    (next: AuthView) => {
      setView(next);
    },
    [setView]
  );

  if (!open) return null;

  const copy = notice ? NOTICE_COPY[notice] : null;

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto" role="dialog" aria-modal="true">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={closeAuth}
        aria-hidden="true"
      />

      <div className="flex min-h-full items-center justify-center p-4">
        <div
          ref={panelRef}
          tabIndex={-1}
          className="relative my-6 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl outline-none sm:p-8"
        >
          <button
            type="button"
            onClick={closeAuth}
            className="absolute right-3 top-3 rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          {copy ? (
            <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 pr-10 text-[12.5px] text-emerald-900">
              <p className="font-bold">{copy.title}</p>
              {copy.body ? <p className="mt-1 leading-relaxed">{copy.body}</p> : null}
              {email ? <p className="mt-1 font-semibold">{email}</p> : null}
            </div>
          ) : null}

          {view === 'login' ? (
            <LoginForm
              defaultEmail={email}
              onSuccess={handleSignedIn}
              onSwitchToRegister={() => switchView('register')}
            />
          ) : (
            <RegisterForm
              onSuccess={() => switchView('login')}
              onSwitchToLogin={() => switchView('login')}
            />
          )}

          <p className="mt-5 text-center text-[11px] leading-relaxed text-gray-400">
            By continuing you agree to our{' '}
            <a href="/terms" className="underline hover:text-gray-600">
              terms
            </a>{' '}
            and{' '}
            <a href="/privacy" className="underline hover:text-gray-600">
              privacy policy
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

export default AuthModal;
