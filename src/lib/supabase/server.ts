import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSupabaseConfig, REMEMBER_COOKIE, rememberCookieOptions } from './config';

export async function createClient() {
  const cookieStore = await cookies();
  const { url, key } = getSupabaseConfig();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        const remember = cookieStore.get(REMEMBER_COOKIE)?.value;
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, rememberCookieOptions(options, remember)),
          );
        } catch {
          // Server Components cannot write cookies; middleware handles refreshes.
        }
      },
    },
  });
}
