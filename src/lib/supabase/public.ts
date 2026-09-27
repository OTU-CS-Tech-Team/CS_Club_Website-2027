import { createClient } from '@supabase/supabase-js';
import { getSupabaseConfig } from './config';

// Cookie-free anon client for public reads. Reading cookies opts a route out of
// static rendering, so cached pages (home, events, careers) must use this one.
export function createPublicClient() {
  const { url, key } = getSupabaseConfig();
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
