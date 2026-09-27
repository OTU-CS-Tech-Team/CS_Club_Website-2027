import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseConfig, REMEMBER_COOKIE, rememberCookieOptions } from '@/lib/supabase/config';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, key } = getSupabaseConfig();
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        const remember = request.cookies.get(REMEMBER_COOKIE)?.value;
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, rememberCookieOptions(options, remember)),
        );
      },
    },
  });

  await supabase.auth.getClaims();
  return response;
}

export const config = {
  matcher: ['/admin/:path*', '/login'],
};
