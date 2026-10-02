import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAdmin } from '@/lib/admin';
import CheckinScanner from './CheckinScanner';

export const metadata = {
  title: 'Event Check-in',
};

export default async function CheckinPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!(await isAdmin(supabase, user?.id))) {
    redirect('/');
  }

  const { data: events } = await supabase
    .from('events')
    .select('id, title')
    .order('starts_at', { ascending: false });

  // small club, small tables — fetch everything once rather than a
  // per-event route; the scanner filters by the selected event client-side
  const admin = createAdminClient();
  const [{ data: rsvps }, { data: profiles }, { data: stamps }, guestResult] = await Promise.all([
    admin.from('event_rsvps').select('event_id, user_id, year_of_study'),
    admin.from('profiles').select('id, full_name, email'),
    admin.from('passport_stamps').select('event_id, user_id').not('event_id', 'is', null),
    admin.from('event_guests').select('event_id, name, email, attended_at, rsvped'),
  ]);

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));
  const attendedSet = new Set((stamps ?? []).map((s) => `${s.event_id}:${s.user_id}`));

  const memberList = (rsvps ?? []).map((rsvp) => {
    const profile = profileById.get(rsvp.user_id);
    return {
      eventId: rsvp.event_id,
      email: profile?.email ?? '',
      name: profile?.full_name || profile?.email || 'Member',
      yearOfStudy: rsvp.year_of_study as string | null,
      attended: attendedSet.has(`${rsvp.event_id}:${rsvp.user_id}`),
    };
  });

  const memberEmails = new Set(
    memberList.flatMap((rsvp) => {
      const email = rsvp.email.trim().toLowerCase();
      return email ? [`${rsvp.eventId}:${email}`] : [];
    }),
  );

  const guestMissingColumn = Boolean(
    guestResult.error &&
      (guestResult.error.code === 'PGRST204' ||
        guestResult.error.message.includes('attended_at') ||
        guestResult.error.message.includes('rsvped')),
  );
  const guests = guestMissingColumn
    ? (
        await admin.from('event_guests').select('event_id, name, email')
      ).data?.map((guest) => ({ ...guest, attended_at: null as string | null, rsvped: true }))
    : guestResult.data;

  const guestList = (guests ?? [])
    .filter((guest) => guest.rsvped !== false)
    .filter((guest) => !memberEmails.has(`${guest.event_id}:${String(guest.email ?? '').trim().toLowerCase()}`))
    .map((guest) => ({
      eventId: guest.event_id,
      email: guest.email ?? '',
      name: guest.name || guest.email || 'Guest',
      yearOfStudy: null,
      attended: Boolean(guest.attended_at),
    }));

  const rsvpList = [...memberList, ...guestList];

  return (
    <div className="page">
      <h1>Event Check-in</h1>
      <p>Pick today&apos;s event, then scan each member&apos;s passport QR as they arrive.</p>
      <CheckinScanner events={events ?? []} rsvps={rsvpList} />
    </div>
  );
}
