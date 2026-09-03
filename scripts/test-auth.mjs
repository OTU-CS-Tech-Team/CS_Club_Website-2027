// Backend-only smoke test for the Supabase auth setup — no frontend needed.
// Run: node --env-file=.env.local scripts/test-auth.mjs
//
// Verifies, against a real throwaway signup:
//   1. sign up succeeds and returns a session (requires "Confirm email" OFF
//      in Supabase Auth settings while testing — otherwise there's no
//      session to run RLS-scoped queries with)
//   2. the on_auth_user_created trigger created a matching profiles row
//   3. RLS lets the user read their own profile
//   4. RLS blocks the user from inserting their own passport_stamps row
//      (no insert policy exists on purpose — only a service-role/admin
//      route should ever be able to award a stamp)
//   5. RLS returns an empty (not errored) read on passport_stamps, since
//      nothing could be inserted

import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anonKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  process.exit(1);
}

let failed = false;
function check(cond, msg) {
  if (cond) {
    console.log('PASS:', msg);
  } else {
    console.error('FAIL:', msg);
    failed = true;
  }
}

const supabase = createClient(url, anonKey);
const testEmail = `test-${Date.now()}@example.com`;
const testPassword = 'test-password-123';

const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
  email: testEmail,
  password: testPassword,
});
check(!signUpError, `sign up succeeds${signUpError ? `: ${signUpError.message}` : ''}`);

if (!signUpData?.session) {
  console.error(
    '\nNo session after sign up — "Confirm email" is likely ON in Supabase ' +
      '(Authentication > Providers > Email). Turn it off while testing, or this ' +
      'script has no session to run the RLS checks below.'
  );
  process.exit(1);
}

const user = signUpData.user;

const { data: profile, error: profileError } = await supabase
  .from('profiles')
  .select('id, email')
  .eq('id', user.id)
  .single();
check(!profileError && profile?.email === testEmail, 'on_auth_user_created trigger creates a matching profiles row');

const { error: insertStampError } = await supabase
  .from('passport_stamps')
  .insert({ user_id: user.id, label: 'self-awarded', points: 999 });
check(!!insertStampError, 'RLS blocks a member from inserting their own passport_stamps row');

const { data: stamps, error: stampsReadError } = await supabase
  .from('passport_stamps')
  .select('*')
  .eq('user_id', user.id);
check(!stampsReadError && stamps?.length === 0, 'RLS lets a member read their own (empty) stamps list without erroring');

await supabase.auth.signOut();

// Optional cleanup: only runs if you've added SUPABASE_SERVICE_ROLE_KEY to
// .env.local (Project Settings > API > service_role — keep it server-only,
// never NEXT_PUBLIC_). Without it, delete test-*@example.com users manually
// from the Supabase dashboard.
if (serviceRoleKey) {
  const admin = createClient(url, serviceRoleKey);
  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
  check(!deleteError, 'cleanup: test user deleted via service role');
}

process.exit(failed ? 1 : 0);
