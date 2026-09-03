import type { SupabaseClient } from '@supabase/supabase-js';

// Admin status is now DB-backed (public.admin_users, enforced by RLS/is_admin()
// on the tables it protects directly) — this just checks the same table for
// routes that gate on it explicitly rather than relying on RLS alone
// (e.g. the passport_stamps/checkin_tokens paths admin_users' RLS doesn't
// cover, since those go through the service-role client).
export async function isAdmin(supabase: SupabaseClient, userId: string | null | undefined) {
  if (!userId) return false;
  const { data } = await supabase
    .from('admin_users')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();
  return !!data;
}
