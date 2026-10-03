import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseConfig } from './config';

let browserClient: SupabaseClient | undefined;

// ReturnType<typeof createBrowserClient> doesn't resolve cleanly against
// its generic/overloaded signature (silently collapses to `any`), so this
// is typed explicitly instead — return right after the assignment so
// narrowing is unambiguous either way.
export function createClient(): SupabaseClient {
  if (browserClient) return browserClient;
  const { url, key } = getSupabaseConfig();
  browserClient = createBrowserClient(url, key);
  return browserClient;
}
