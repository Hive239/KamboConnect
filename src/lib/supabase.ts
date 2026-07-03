import { createClient } from '@supabase/supabase-js';

/**
 * Supabase client. Configure via a gitignored `.env`:
 *   VITE_SUPABASE_URL=https://ehqsudxguigezjaygsrr.supabase.co
 *   VITE_SUPABASE_ANON_KEY=<your anon/public key from Settings → API>
 *
 * The app still runs on the mock adapter (src/data/store.ts) until the data
 * layer is switched over; this client is the target for that swap.
 */
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase = isSupabaseConfigured
  ? createClient(url!, anonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        // PKCE so native OAuth can complete via exchangeCodeForSession (see native.ts).
        flowType: 'pkce',
      },
    })
  : null;
