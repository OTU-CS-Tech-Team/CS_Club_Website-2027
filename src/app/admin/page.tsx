import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient, isAdminClientConfigured } from '@/lib/supabase/admin';
import { mapDatabaseEvent } from '@/lib/content';
import { getMailingListSubscribers, type MailingListSubscriber } from '@/lib/members';
import { NEWSLETTER_HISTORY_LIMIT, pruneNewsletterHistory } from '@/lib/newsletters';
import type { ClubJob, EventAttendee, ManagedEvent } from '@/types/content';
import AdminDashboard from './AdminDashboard';

export const metadata = {
  title: 'Admin Dashboard',
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
  let attendees: EventAttendee[] = [];
  let attendanceLoadError = adminClient
    ? ''
    : 'RSVP information is unavailable because secure server access is not configured.';

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

    const eventIds = eventRows.map((event) => event.id).filter(Boolean);
    if (eventIds.length) {
      const [memberResult, guestResult, stampResult] = await Promise.all([
        adminClient
          .from('event_rsvps')
          .select('event_id, user_id, year_of_study, suggestions')
          .in('event_id', eventIds),
        adminClient
          .from('event_guests')
          .select('id, event_id, name, email, student_id, suggestions, confirmed')
          .in('event_id', eventIds),
        // All stamps, not just current events: stamps from deleted events have a null event_id but still count toward passport points.
        adminClient
          .from('passport_stamps')
          .select('event_id, user_id, points'),
      ]);

      const attendanceError = memberResult.error ?? guestResult.error ?? stampResult.error;
      if (attendanceError) {
        console.error('Unable to load event RSVPs', {
          code: attendanceError.code,
          message: attendanceError.message,
        });
        attendanceLoadError = 'RSVP information could not be loaded. Refresh the page and try again.';
      } else {
        const stamps = stampResult.data ?? [];
        const rsvpKeys = new Set((memberResult.data ?? []).map((rsvp) => `${rsvp.event_id}:${rsvp.user_id}`));
        const loadedEventIds = new Set(eventIds);
        const walkIns = stamps
          .filter((stamp) => stamp.event_id && loadedEventIds.has(stamp.event_id) && !rsvpKeys.has(`${stamp.event_id}:${stamp.user_id}`))
          .map((stamp) => ({ event_id: stamp.event_id as string, user_id: stamp.user_id, year_of_study: null, suggestions: null }));
        const memberRows = [...(memberResult.data ?? []), ...walkIns];
        const memberIds = Array.from(new Set(memberRows.map((row) => row.user_id)));
        const profileResult = memberIds.length
          ? await adminClient.from('profiles').select('id, full_name, email').in('id', memberIds)
          : { data: [], error: null };

        if (profileResult.error) {
          console.error('Unable to load RSVP profiles', {
            code: profileResult.error.code,
            message: profileResult.error.message,
          });
          attendanceLoadError = 'RSVP information could not be loaded. Refresh the page and try again.';
        } else {
          const profiles = new Map((profileResult.data ?? []).map((profile) => [profile.id, profile]));
          const attendedMembers = new Set(stamps.map((stamp) => `${stamp.event_id}:${stamp.user_id}`));
          const pointsByUser = new Map<string, number>();
          for (const stamp of stamps) {
            pointsByUser.set(stamp.user_id, (pointsByUser.get(stamp.user_id) ?? 0) + stamp.points);
          }

          attendees = [
            ...memberRows.map((rsvp): EventAttendee => {
              const profile = profiles.get(rsvp.user_id);
              return {
                id: `member:${rsvp.event_id}:${rsvp.user_id}`,
                event_id: rsvp.event_id,
                name: profile?.full_name || profile?.email || 'Member',
                email: profile?.email ?? '',
                student_id: null,
                year_of_study: rsvp.year_of_study,
                suggestions: rsvp.suggestions ?? null,
                points: pointsByUser.get(rsvp.user_id) ?? 0,
                kind: 'member',
                status: attendedMembers.has(`${rsvp.event_id}:${rsvp.user_id}`) ? 'attended' : 'confirmed',
              };
            }),
            ...(guestResult.data ?? []).map((guest): EventAttendee => ({
              id: `guest:${guest.id}`,
              event_id: guest.event_id,
              name: guest.name || guest.email || 'Guest',
              email: guest.email ?? '',
              student_id: guest.student_id ?? null,
              year_of_study: null,
              suggestions: guest.suggestions ?? null,
              points: null,
              kind: 'guest',
              status: guest.confirmed ? 'confirmed' : 'pending',
            })),
          ];
        }
      }
    }
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
      attendees={attendees}
      loadErrors={{ events: eventsLoadError, jobs: jobsLoadError, attendance: attendanceLoadError }}
    />
  );
}
