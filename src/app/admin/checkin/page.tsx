import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAdminEmail } from '@/lib/admin';
import CheckinScanner from './CheckinScanner';

export default async function CheckinPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isAdminEmail(user?.email)) {
    redirect('/');
  }

  const { data: events } = await supabase
    .from('events')
    .select('id, title')
    .order('starts_at', { ascending: false });

  // small club, small tables — fetch everything once rather than a
  // per-event route; the scanner filters by the selected event client-side
  const admin = createAdminClient();
  const [{ data: rsvps }, { data: profiles }, { data: stamps }] = await Promise.all([
    admin.from('event_rsvps').select('event_id, user_id'),
    admin.from('profiles').select('id, full_name, email'),
    admin.from('passport_stamps').select('event_id, user_id').not('event_id', 'is', null),
  ]);

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));
  const attendedSet = new Set((stamps ?? []).map((s) => `${s.event_id}:${s.user_id}`));

  const rsvpList = (rsvps ?? []).map((rsvp) => {
    const profile = profileById.get(rsvp.user_id);
    return {
      eventId: rsvp.event_id,
      email: profile?.email ?? '',
      name: profile?.full_name || profile?.email || 'Member',
      attended: attendedSet.has(`${rsvp.event_id}:${rsvp.user_id}`),
    };
  });

  return (
    <div className="page">
      <h1>Event Check-in</h1>
      <p>Pick today&apos;s event, then scan each member&apos;s passport QR as they arrive.</p>
      <CheckinScanner events={events ?? []} rsvps={rsvpList} />
    </div>
  );
}
