export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('Supabase environment variables are not configured.');
  }

  return { url, key };
}

// "Remember me" left unchecked -> auth cookies drop the library's 400-day
// maxAge and become session cookies, so closing the browser signs you out.
export const REMEMBER_COOKIE = 'remember_me';

export function rememberCookieOptions<T extends { maxAge?: number; expires?: Date }>(
  options: T,
  remember: string | undefined,
): T {
  // maxAge 0 is a delete and must go through untouched.
  if (remember !== '0' || !options.maxAge) return options;
  const { maxAge: _maxAge, expires: _expires, ...sessionOnly } = options;
  return sessionOnly as T;
}
