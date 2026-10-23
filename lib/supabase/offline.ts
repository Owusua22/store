// lib/supabase/offline.ts
// A tiny chainable, awaitable stub that mimics the parts of the Supabase
// client used by this app. It lets pages render (empty states) when no
// Supabase project is configured instead of throwing at runtime.

/* eslint-disable @typescript-eslint/no-explicit-any */

const EMPTY_RESULT = { data: [] as any[], error: null, count: 0 };

function createQueryBuilder(): any {
  const target = function () {
    /* noop */
  };

  const proxy: any = new Proxy(target, {
    get(_target, prop) {
      if (prop === 'then') {
        return (resolve: (value: typeof EMPTY_RESULT) => unknown) =>
          Promise.resolve(EMPTY_RESULT).then(resolve);
      }

      if (prop === 'catch' || prop === 'finally') {
        return () => proxy;
      }

      if (prop === 'single' || prop === 'maybeSingle') {
        return () => Promise.resolve({ data: null, error: null });
      }

      if (prop === 'count' || prop === 'length') {
        return 0;
      }

      return () => proxy;
    },
    apply() {
      return proxy;
    },
  });

  return proxy;
}

/**
 * Plain object (not a Proxy) so it is never treated as a thenable when an
 * async function returns it.
 */
export function createOfflineClient(): any {
  return {
    from: () => createQueryBuilder(),
    rpc: () => createQueryBuilder(),
    storage: {
      from: () => ({
        upload: async () => ({
          data: null,
          error: new Error('Storage is not configured.'),
        }),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
        remove: async () => ({ data: null, error: null }),
      }),
    },
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
      signInWithPassword: async () => ({
        data: { user: null, session: null },
        error: new Error('Authentication is not configured.'),
      }),
      signUp: async () => ({
        data: { user: null, session: null },
        error: new Error('Authentication is not configured.'),
      }),
      signOut: async () => ({ error: null }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: () => undefined } },
      }),
    },
    channel: () => ({
      on: () => ({ subscribe: () => ({}) }),
      subscribe: () => ({}),
      unsubscribe: () => Promise.resolve(),
    }),
    removeChannel: () => Promise.resolve(),
  };
}
