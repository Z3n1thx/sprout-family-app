/**
 * Supabase client for Sprout v2.
 *
 * End-to-end encrypted cloud sync. The server stores encrypted family data;
 * encryption keys stay on the client. This preserves the privacy model from v1
 * while adding multi-device sync.
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Feature flag: gracefully degrade if Supabase not configured
export const CLOUD_SYNC_ENABLED = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = CLOUD_SYNC_ENABLED
  ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null;

/**
 * Check if user is authenticated.
 */
export async function isAuthenticated(): Promise<boolean> {
  if (!supabase) return false;
  const { data } = await supabase.auth.getSession();
  return data.session !== null;
}

/**
 * Get current user ID.
 */
export async function getCurrentUserId(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

/**
 * Sign in with magic link (passwordless email).
 */
export async function signInWithEmail(email: string): Promise<{ error: Error | null }> {
  if (!supabase) return { error: new Error('Cloud sync not configured') };

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: window.location.origin,
    },
  });

  return { error };
}

/**
 * Sign out.
 */
export async function signOut(): Promise<void> {
  if (!supabase) return;
  await supabase.auth.signOut();
}

/**
 * Listen for auth state changes.
 */
export function onAuthStateChange(callback: (userId: string | null) => void) {
  if (!supabase) return () => {};

  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user.id ?? null);
  });

  return () => subscription.unsubscribe();
}
