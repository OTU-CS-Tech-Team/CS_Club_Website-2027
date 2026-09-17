import { type NextRequest } from 'next/server';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isAllowedAuthEmail } from '@/lib/authEmail';

// OAuth (Google) lands here with a one-time code; swapping it for a session
// sets the auth cookies, same as a password sign-in.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const nextParam = searchParams.get('next') ?? '/passport';
  // Only allow relative paths — a full URL here would be an open redirect.
  const next = nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : '/passport';

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Google will happily sign in a personal Gmail; member accounts are Ontario Tech
      // only. Execs on a club address stay allowed so nobody is locked out of /admin.
      const user = data.session?.user;
      if (!isAllowedAuthEmail(user?.email)) {
        const { data: admin } = await supabase
          .from('admin_users')
          .select('user_id')
          .eq('user_id', user?.id ?? '')
          .maybeSingle();
        if (!admin) {
          await supabase.auth.signOut();
          redirect('/login?error=domain');
        }
      }
      redirect(next);
    }
  }

  redirect('/login?error=sso');
}
