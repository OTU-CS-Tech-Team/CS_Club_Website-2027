import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { mapDatabaseEvent } from '@/lib/content';
import { getGeneralMemberEmails } from '@/lib/members';
import type { ClubJob, ManagedEvent } from '@/types/content';
import AdminDashboard from './AdminDashboard';

export const metadata = {
  title: 'Executive dashboard — CS Club',
  description: 'Manage CS Club events and job postings.',
};

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect('/login');

  const { data: admin } = await supabase
    .from('admin_users')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!admin) redirect('/login');

  const adminClient = createAdminClient();
  const [eventsResult, jobsResult, recipients, newslettersResult] = await Promise.all([
    supabase.from('events').select('id, title, description, location, starts_at, ends_at, images, points, created_at, updated_at').order('starts_at', { ascending: false }),
    supabase.from('jobs').select('*').order('created_at', { ascending: false }),
    getGeneralMemberEmails(adminClient),
    adminClient.from('newsletters').select('id, subject, recipient_count, sent_at').order('sent_at', { ascending: false }).limit(10),
  ]);

  return (
    <AdminDashboard
      email={user.email ?? 'Executive'}
      events={(eventsResult.data ?? []).map(mapDatabaseEvent).filter((event): event is ManagedEvent => event !== null)}
      jobs={(jobsResult.data ?? []) as ClubJob[]}
      recipientCount={recipients.length}
      newsletters={newslettersResult.data ?? []}
    />
  );
}
