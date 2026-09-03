import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEventEmail } from '@/lib/email';
import { toDateString, toTimeString } from '@/lib/dbEvents';

// Runs on a schedule (see vercel.json) — Vercel Cron sends
// "Authorization: Bearer $CRON_SECRET" automatically, which is what keeps
// this from being a public "email everyone" endpoint.
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response(null, { status: 401 });
  }

  const admin = createAdminClient();

  // events starting within the next ~25h — a bit over 24h so a once-daily
  // run doesn't miss one sitting right at the boundary
  const now = new Date();
  const windowEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);

  const { data: events } = await admin
    .from('events')
    .select('id, title, location, starts_at')
    .gte('starts_at', now.toISOString())
    .lte('starts_at', windowEnd.toISOString());

  let sent = 0;

  for (const event of events ?? []) {
    if (!event.starts_at) continue;

    const { data: rsvps } = await admin
      .from('event_rsvps')
      .select('id, user_id')
      .eq('event_id', event.id)
      .is('reminder_sent_at', null);

    if (!rsvps || rsvps.length === 0) continue;

    const { data: profiles } = await admin
      .from('profiles')
      .select('id, email')
      .in(
        'id',
        rsvps.map((rsvp) => rsvp.user_id)
      );

    const emailById = new Map((profiles ?? []).map((profile) => [profile.id, profile.email]));
    const when = `${toDateString(event.starts_at)} at ${toTimeString(event.starts_at)}`;

    for (const rsvp of rsvps) {
      const email = emailById.get(rsvp.user_id);
      if (!email) continue;

      await sendEventEmail(email, `Reminder: ${event.title} is coming up`, {
        heading: 'See you soon!',
        intro: `This is a friendly reminder that you're RSVP'd for the following event.`,
        title: event.title,
        when,
        location: event.location,
      });
      await admin
        .from('event_rsvps')
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq('id', rsvp.id);
      sent++;
    }
  }

  return NextResponse.json({ sent });
}
