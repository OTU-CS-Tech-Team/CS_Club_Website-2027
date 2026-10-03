import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient, isAdminClientConfigured } from '@/lib/supabase/admin';
import {
  getCachedEvents,
  getCachedJobs,
  getCachedSubscribers,
  getCachedNewsletters,
  getCreatorEmailsBatched,
} from '@/lib/admin-cache';
import { pruneNewsletterHistory } from '@/lib/newsletters';
import { isMissingColumnError, missingColumnName, normalizeAnswers, recoverPackedIdeas } from '@/lib/jobSections';
import type { EventAttendee, JobApplication } from '@/types/content';
import AdminDashboard from './AdminDashboard';

export const metadata = {
  title: 'Admin Dashboard',
  description: 'Manage CS Club events and job postings.',
};

export const dynamic = 'force-dynamic';

function applicationText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

async function loadEventGuests(adminClient: ReturnType<typeof createAdminClient>, eventIds: string[]) {
  const withAttendance = await adminClient
    .from('event_guests')
    .select('id, event_id, name, email, student_id, suggestions, confirmed, attended_at, rsvped')
    .in('event_id', eventIds);

  if (!withAttendance.error) return withAttendance;

  const message = withAttendance.error.message ?? '';
  const missingColumn = withAttendance.error.code === 'PGRST204' || message.includes('attended_at') || message.includes('rsvped');
  if (!missingColumn) return withAttendance;

  const basic = await adminClient
    .from('event_guests')
    .select('id, event_id, name, email, student_id, suggestions, confirmed')
    .in('event_id', eventIds);

  return {
    data: (basic.data ?? []).map((guest) => ({ ...guest, attended_at: null as string | null, rsvped: true })),
    error: basic.error,
  };
}

function toApplication(row: Record<string, unknown>, index: number): JobApplication {
  const recovered = recoverPackedIdeas(typeof row.ideas === 'string' ? row.ideas : null);
  const answers = normalizeAnswers(row.answers);
  const resumePath = applicationText(row.resume_path) || recovered.resumePath;
  return {
    id: applicationText(row.id) || `${applicationText(row.job_id)}-${applicationText(row.ontario_tech_email)}-${index}`,
    job_id: applicationText(row.job_id),
    first_name: applicationText(row.first_name),
    last_name: applicationText(row.last_name),
    ontario_tech_email: applicationText(row.ontario_tech_email),
    student_id: applicationText(row.student_id),
    year_of_study: applicationText(row.year_of_study),
    program_of_study: applicationText(row.program_of_study),
    ideas: recovered.ideas,
    resume_path: resumePath || null,
    answers: answers.length ? answers : recovered.answers,
    created_at: applicationText(row.created_at) || null,
  };
}

async function loadCareerApplications(admin: ReturnType<typeof createAdminClient>) {
  let columns = ['id', 'job_id', 'first_name', 'last_name', 'ontario_tech_email', 'student_id', 'year_of_study', 'program_of_study', 'ideas', 'resume_path', 'answers', 'created_at'];
  for (let attempt = 0; attempt < 6; attempt += 1) {
    let query = admin.from('career_applications').select(columns.join(', '));
    if (columns.includes('created_at')) query = query.order('created_at', { ascending: false });
    const result = await query;
    if (!result.error) {
      return {
        rows: ((result.data ?? []) as unknown as Record<string, unknown>[]).map(toApplication),
        error: '',
      };
    }
    if (!isMissingColumnError(result.error)) {
      console.error('Unable to load applications', { code: result.error.code, message: result.error.message });
      return { rows: [] as JobApplication[], error: 'Applications could not be loaded. Refresh the page and try again.' };
    }
    const missing = missingColumnName(result.error);
    const drop = missing && columns.includes(missing)
      ? missing
      : ['answers', 'resume_path', 'ideas', 'id', 'created_at'].find((column) => columns.includes(column));
    if (!drop) break;
    columns = columns.filter((column) => column !== drop);
  }
  return { rows: [] as JobApplication[], error: 'Applications could not be loaded. Refresh the page and try again.' };
}

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

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';

  const [eventsData, jobsData, subscribers, newsletters] = await Promise.all([
    getCachedEvents(supabaseUrl),
    getCachedJobs(supabaseUrl),
    getCachedSubscribers(),
    getCachedNewsletters(),
  ]);

  const eventRows = eventsData.events;
  const eventsLoadError = eventsData.error;
  const jobRows = jobsData.jobs;
  const jobsLoadError = jobsData.error;

  const creatorIds = [...eventRows, ...jobRows]
    .map((item) => item.created_by)
    .filter((id): id is string => Boolean(id));

  const adminClientConfigured = isAdminClientConfigured();
  const adminClient = adminClientConfigured ? createAdminClient() : null;

  const [creatorEmails, applicationsData] = await Promise.all([
    getCreatorEmailsBatched(creatorIds, user.email ?? undefined, user.id),
    adminClient 
      ? loadCareerApplications(adminClient)
      : Promise.resolve({ rows: [] as JobApplication[], error: 'Applications are unavailable because secure server access is not configured.' }),
  ]);

  const applications = applicationsData.rows;
  let applicationsLoadError = applicationsData.error;

  let attendees: EventAttendee[] = [];
  let attendanceLoadError = adminClient
    ? ''
    : 'RSVP information is unavailable because secure server access is not configured.';

  if (adminClient) {
    pruneNewsletterHistory(adminClient).catch((err) => {
      console.error('Newsletter prune failed:', err);
    });

    const eventIds = eventRows.map((event) => event.id).filter(Boolean);
    if (eventIds.length) {
      const [memberResult, guestResult, stampResult] = await Promise.all([
        adminClient
          .from('event_rsvps')
          .select('event_id, user_id, year_of_study, suggestions')
          .in('event_id', eventIds),
        loadEventGuests(adminClient, eventIds),
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
        const memberRows = [
          ...(memberResult.data ?? []).map((row) => ({ ...row, rsvped: true })),
          ...walkIns.map((row) => ({ ...row, rsvped: false })),
        ];
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

          const memberEmailKeys = new Set(
            memberRows.flatMap((row) => {
              const email = String(profiles.get(row.user_id)?.email ?? '').trim().toLowerCase();
              return email ? [`${row.event_id}:${email}`] : [];
            }),
          );

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
                rsvped: rsvp.rsvped,
              };
            }),
            ...(guestResult.data ?? [])
              .filter((guest) => !memberEmailKeys.has(`${guest.event_id}:${String(guest.email ?? '').trim().toLowerCase()}`))
              .map((guest): EventAttendee => ({
                id: `guest:${guest.id}`,
                event_id: guest.event_id,
                name: guest.name || guest.email || 'Guest',
                email: guest.email ?? '',
                student_id: guest.student_id ?? null,
                year_of_study: null,
                suggestions: guest.suggestions ?? null,
                points: null,
                kind: 'guest',
                status: guest.attended_at ? 'attended' : guest.confirmed ? 'confirmed' : 'pending',
                rsvped: guest.rsvped !== false,
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
      applications={applications}
      loadErrors={{ events: eventsLoadError, jobs: jobsLoadError, attendance: attendanceLoadError, applications: applicationsLoadError }}
    />
  );
}
