import type { SupabaseClient } from '@supabase/supabase-js';

/** Keep only the newest N newsletter history rows so the dashboard stays light. */
export const NEWSLETTER_HISTORY_LIMIT = 4;

export async function pruneNewsletterHistory(
  admin: SupabaseClient,
  keep = NEWSLETTER_HISTORY_LIMIT,
) {
  const { data, error } = await admin
    .from('newsletters')
    .select('id')
    .order('sent_at', { ascending: false });
  if (error || !data || data.length <= keep) return;
  const staleIds = data.slice(keep).map((row) => row.id);
  if (staleIds.length === 0) return;
  const { error: deleteError } = await admin.from('newsletters').delete().in('id', staleIds);
  if (deleteError) {
    console.error('Unable to prune newsletter history', deleteError.message);
  }
}
