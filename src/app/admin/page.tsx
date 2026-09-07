import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient, isAdminClientConfigured } from '@/lib/supabase/admin';
import { mapDatabaseEvent } from '@/lib/content';
import { getMailingListSubscribers, type MailingListSubscriber } from '@/lib/members';
import { NEWSLETTER_HISTORY_LIMIT, pruneNewsletterHistory } from '@/lib/newsletters';
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

  const [eventsResult, jobsResult] = await Promise.all([
    supabase.from('events').select('id, title, description, location, starts_at, ends_at, images, points, is_published, created_by, created_at, updated_at').order('starts_at', { ascending: false }),
    supabase.from('jobs').select('id, title, category, description, is_active, closes_at, commitment, location, created_by, created_at, updated_at').order('created_at', { ascending: false }),
  ]);

  // Keep the dashboard usable while the additive content-controls migration rolls out.
  let eventRows: ManagedEvent[];
  let eventsLoadError = '';
  if (eventsResult.error?.code === '42703') {
    const legacyEventsResult = await supabase
      .from('events')
      .select('id, title, description, location, starts_at, ends_at, images, points, created_by, created_at, updated_at')
      .order('starts_at', { ascending: false });
    eventRows = (legacyEventsResult.data ?? [])
      .map(mapDatabaseEvent)
      .filter((event): event is ManagedEvent => event !== null);
    if (legacyEventsResult.error) {
      console.error('Unable to load dashboard events', {
        code: legacyEventsResult.error.code,
        message: legacyEventsResult.error.message,
      });
      eventsLoadError = 'Events could not be loaded. Refresh the page and try again.';
    }
  } else {
    eventRows = (eventsResult.data ?? [])
      .map(mapDatabaseEvent)
      .filter((event): event is ManagedEvent => event !== null);
    if (eventsResult.error) {
      console.error('Unable to load dashboard events', {
        code: eventsResult.error.code,
        message: eventsResult.error.message,
      });
      eventsLoadError = 'Events could not be loaded. Refresh the page and try again.';
    }
  }

  let jobRows: ClubJob[];
  let jobsLoadError = '';
  if (jobsResult.error?.code === '42703') {
    const legacyJobsResult = await supabase
      .from('jobs')
      .select('id, title, category, description, is_active, created_by, created_at, updated_at')
      .order('created_at', { ascending: false });
    jobRows = (legacyJobsResult.data ?? []) as ClubJob[];
    if (legacyJobsResult.error) {
      console.error('Unable to load dashboard jobs', {
        code: legacyJobsResult.error.code,
        message: legacyJobsResult.error.message,
      });
      jobsLoadError = 'Jobs could not be loaded. Refresh the page and try again.';
    }
  } else {
    jobRows = (jobsResult.data ?? []) as ClubJob[];
    if (jobsResult.error) {
      console.error('Unable to load dashboard jobs', {
        code: jobsResult.error.code,
        message: jobsResult.error.message,
      });
      jobsLoadError = 'Jobs could not be loaded. Refresh the page and try again.';
    }
  }

  const adminClientConfigured = isAdminClientConfigured();
  const adminClient = adminClientConfigured ? createAdminClient() : null;
  const creatorEmails: Record<string, string> = {};
  if (user.email) creatorEmails[user.id] = user.email;

  if (adminClient) {
    const creatorIds = Array.from(new Set(
      [...eventRows, ...jobRows]
        .map((item) => item.created_by)
        .filter((id): id is string => Boolean(id) && id !== user.id),
    ));
    await Promise.all(creatorIds.map(async (creatorId) => {
      const { data, error } = await adminClient.auth.admin.getUserById(creatorId);
      if (!error && data.user?.email) creatorEmails[creatorId] = data.user.email;
    }));
  }

  let subscribers: MailingListSubscriber[] = [];
  let newsletters: Array<{ id: string; subject: string; recipient_count: number; sent_at: string }> = [];

  if (adminClient) {
    await pruneNewsletterHistory(adminClient);
    const [subscriberRows, newslettersResult] = await Promise.all([
      getMailingListSubscribers(adminClient),
      adminClient
      .from('newsletters')
      .select('id, subject, recipient_count, sent_at')
      .order('sent_at', { ascending: false })
      .limit(NEWSLETTER_HISTORY_LIMIT),
    ]);
    subscribers = subscriberRows;
    newsletters = newslettersResult.data ?? [];
  }

  return (
    <AdminDashboard
      email={user.email ?? 'Executive'}
      events={eventRows}
      jobs={jobRows}
      subscribers={subscribers}
      newsletters={newsletters}
      newsletterConfigured={adminClientConfigured}
      creatorEmails={creatorEmails}
      loadErrors={{ events: eventsLoadError, jobs: jobsLoadError }}
    />
  );
}
