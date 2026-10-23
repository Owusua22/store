// src/lib/supabase/client.ts
// ✅ FIXED: Uses @supabase/ssr instead of deprecated package

import { createBrowserClient } from '@supabase/ssr';

// Cache the client to avoid creating multiple instances
let client: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (client) return client;

  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  return client;
}