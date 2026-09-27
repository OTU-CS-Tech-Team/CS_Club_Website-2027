import { createBrowserClient, parseCookieHeader, serializeCookieHeader } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseConfig, REMEMBER_COOKIE, rememberCookieOptions } from './config';

let browserClient: SupabaseClient | undefined;

// ReturnType<typeof createBrowserClient> doesn't resolve cleanly against
// its generic/overloaded signature (silently collapses to `any`), so this
// is typed explicitly instead — return right after the assignment so
// narrowing is unambiguous either way.
export function createClient(): SupabaseClient {
  if (browserClient) return browserClient;
  const { url, key } = getSupabaseConfig();
  browserClient = createBrowserClient(url, key, {
    cookies: {
      getAll: () => parseCookieHeader(document.cookie),
      setAll(cookiesToSet) {
        const remember = parseCookieHeader(document.cookie).find((c) => c.name === REMEMBER_COOKIE)?.value;
        cookiesToSet.forEach(({ name, value, options }) => {
          document.cookie = serializeCookieHeader(name, value, rememberCookieOptions(options, remember));
        });
      },
    },
  });
  return browserClient;
}
