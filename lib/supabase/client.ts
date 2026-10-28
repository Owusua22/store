// lib/supabase/client.ts
// Browser Supabase client. Returns null in demo mode (no credentials) so the
// storefront can keep working with local demo auth + cart state.

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from './config';

let client: SupabaseClient | null = null;

export function createClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (client) return client;

  client = createBrowserClient(supabaseUrl, supabaseAnonKey);
  return client;
}
