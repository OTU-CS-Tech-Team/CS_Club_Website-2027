import type { SupabaseClient } from '@supabase/supabase-js';

// "General member" = applied via career_applications for the
// general-member job posting — separate from having a website login
// (profiles/auth.users are about passport/event access, not membership).
// A handful of legacy rows predate the jobs table and have job_id null;
// they're treated as general-member applications too since that was the
// only kind of application that existed when they were submitted.
export async function getGeneralMemberEmails(supabase: SupabaseClient): Promise<string[]> {
  const { data } = await supabase
    .from('career_applications')
    .select('ontario_tech_email')
    .or('job_id.eq.general-member,job_id.is.null');

  const emails = (data ?? [])
    .map((row) => (row.ontario_tech_email as string | null)?.toLowerCase().trim())
    .filter((email): email is string => !!email);

  return Array.from(new Set(emails));
}
