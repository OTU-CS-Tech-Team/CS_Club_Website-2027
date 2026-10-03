import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAdmin } from '@/lib/admin';

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function missingAttendanceColumns(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  const message = error.message ?? '';
  return error.code === 'PGRST204' || message.includes('attended_at') || message.includes('rsvped');
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!(await isAdmin(supabase, user?.id))) {
    return new Response(null, { status: 401 });
  }

  const url = new URL(request.url);
  const eventId = url.searchParams.get('eventId');

  if (!eventId) {
    return NextResponse.json({ error: 'Event ID required' }, { status: 400 });
  }

  try {
    const admin = createAdminClient();

    const [rsvpsResult, profilesResult, stampsResult, guestsResult] = await Promise.all([
      admin.from('event_rsvps').select('event_id, user_id, year_of_study').eq('event_id', eventId),
      admin.from('profiles').select('id, full_name, email'),
      admin.from('passport_stamps').select('event_id, user_id').eq('event_id', eventId),
      admin.from('event_guests').select('event_id, name, email, attended_at, rsvped').eq('event_id', eventId),
    ]);

    const profileById = new Map((profilesResult.data ?? []).map((p) => [p.id, p]));
    const attendedSet = new Set((stampsResult.data ?? []).map((s) => `${s.event_id}:${s.user_id}`));

    const memberList = (rsvpsResult.data ?? []).map((rsvp) => {
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

    let guests = guestsResult.data;
    if (missingAttendanceColumns(guestsResult.error)) {
      const fallbackResult = await admin
        .from('event_guests')
        .select('event_id, name, email')
        .eq('event_id', eventId);
      guests = fallbackResult.data?.map((guest) => ({ ...guest, attended_at: null as string | null, rsvped: true })) ?? [];
    }

    const guestList = (guests ?? [])
      .filter((guest) => guest.rsvped !== false)
      .filter((guest) => !memberEmails.has(`${guest.event_id}:${normalizeEmail(String(guest.email ?? ''))}`))
      .map((guest) => ({
        eventId: guest.event_id,
        email: guest.email ?? '',
        name: guest.name || guest.email || 'Guest',
        yearOfStudy: null,
        attended: Boolean(guest.attended_at),
      }));

    const rsvpList = [...memberList, ...guestList];

    return NextResponse.json({ rsvps: rsvpList });
  } catch (error) {
    console.error('Failed to load RSVPs:', error);
    return NextResponse.json({ error: 'Failed to load RSVPs' }, { status: 500 });
  }
}
