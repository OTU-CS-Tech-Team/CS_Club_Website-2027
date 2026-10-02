import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAdmin } from '@/lib/admin';

const OTU_EMAIL = /^[^\s@]+@ontariotechu\.(net|ca)$/i;
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function missingAttendanceColumns(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  const message = error.message ?? '';
  return error.code === 'PGRST204' || message.includes('attended_at') || message.includes('rsvped');
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!(await isAdmin(supabase, user?.id))) {
    return new Response(null, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const token = typeof body?.token === 'string' ? body.token : '';
  const email = typeof body?.email === 'string' ? normalizeEmail(body.email) : '';
  const eventId = typeof body?.eventId === 'string' ? body.eventId : '';
  // preview: resolve who the code belongs to and which event, but don't
  // record anything — lets the admin see a name before they confirm.
  const preview = body?.preview === true;

  if ((!token && !email) || !eventId) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    const { data: eventRow } = await admin.from('events').select('title, points').eq('id', eventId).single();

    if (!eventRow) {
      return NextResponse.json({ error: 'Event not found' }, { status: 400 });
    }

    let userId = '';

    if (token) {
      // scanned path: resolve via the member's short-lived passport QR
      // token. Never deleted here — it expires on its own in 5 min, and the
      // passport_stamps unique index below is what actually stops a double
      // check-in. Deleting on use just made an accidental re-scan of a
      // still-displayed QR report "invalid code" instead of "already in".
      const { data: tokenRow } = await admin
        .from('checkin_tokens')
        .select('user_id, expires_at')
        .eq('token', token)
        .single();

      if (!tokenRow || new Date(tokenRow.expires_at) < new Date()) {
        return NextResponse.json({ error: 'Invalid or expired code' }, { status: 400 });
      }
      userId = tokenRow.user_id;
    } else if (email) {
      const { data: profiles, error: profileError } = await admin
        .from('profiles')
        .select('id, email')
        .ilike('email', email.replace(/[%_\\]/g, '\\$&'));
      if (profileError) throw profileError;
      const profileMatch = (profiles ?? []).find((profile) => normalizeEmail(String(profile.email ?? '')) === email);
      if (profileMatch) userId = profileMatch.id;
    }

    if (userId) {
      const { data: profile } = await admin.from('profiles').select('full_name, email').eq('id', userId).single();
      const displayName = profile?.full_name || profile?.email || 'Member';

      if (preview) {
        return NextResponse.json({
          name: displayName,
          event: eventRow.title,
          points: eventRow.points,
        });
      }

      const { error: insertError } = await admin.from('passport_stamps').insert({
        user_id: userId,
        label: eventRow.title,
        points: eventRow.points,
        event_id: eventId,
      });

      if (insertError && insertError.code === '23505') {
        return NextResponse.json(
          { error: `${displayName} is already checked in to ${eventRow.title}` },
          { status: 409 },
        );
      }

      if (insertError) throw insertError;

      // If they also RSVP'd as a guest, mark that row so the roster doesn't
      // keep a second "RSVP'd" line for the same email.
      const profileEmail = normalizeEmail(String(profile?.email ?? ''));
      if (profileEmail) await markGuestAttended(admin, eventId, profileEmail);

      revalidatePath('/admin');
      revalidatePath('/admin/checkin');
      return NextResponse.json({
        name: displayName,
        event: eventRow.title,
        points: eventRow.points,
      });
    }

    if (!EMAIL_SHAPE.test(email)) {
      return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
    }

    const { data: guestRows, error: guestError } = await admin
      .from('event_guests')
      .select('id, name, email, attended_at')
      .eq('event_id', eventId);

    if (missingAttendanceColumns(guestError)) {
      return NextResponse.json(
        { error: 'Guest check-in needs the latest database migration. Apply it in Supabase, then try again.' },
        { status: 500 },
      );
    }
    if (guestError) throw guestError;

    const guest = (guestRows ?? []).find((row) => normalizeEmail(String(row.email ?? '')) === email);
    const displayName = guest?.name || email;

    if (guest?.attended_at) {
      return NextResponse.json(
        { error: `${displayName} is already checked in to ${eventRow.title}` },
        { status: 409 },
      );
    }

    if (guest) {
      const { error: updateError } = await admin
        .from('event_guests')
        .update({ attended_at: new Date().toISOString(), confirmed: true })
        .eq('id', guest.id);

      if (missingAttendanceColumns(updateError)) {
        return NextResponse.json(
          { error: 'Guest check-in needs the latest database migration. Apply it in Supabase, then try again.' },
          { status: 500 },
        );
      }
      if (updateError) throw updateError;
    } else {
      if (!OTU_EMAIL.test(email)) {
        return NextResponse.json(
          { error: 'Use an Ontario Tech email (@ontariotechu.net or @ontariotechu.ca).' },
          { status: 400 },
        );
      }

      const { error: insertError } = await admin.from('event_guests').insert({
        event_id: eventId,
        name: email,
        email,
        confirmed: true,
        attended_at: new Date().toISOString(),
        rsvped: false,
      });

      if (insertError && insertError.code === '23505') {
        return NextResponse.json(
          { error: `${email} is already checked in to ${eventRow.title}` },
          { status: 409 },
        );
      }
      if (missingAttendanceColumns(insertError)) {
        return NextResponse.json(
          { error: 'Guest check-in needs the latest database migration. Apply it in Supabase, then try again.' },
          { status: 500 },
        );
      }
      if (insertError) throw insertError;
    }

    revalidatePath('/admin');
    revalidatePath('/admin/checkin');
    return NextResponse.json({
      name: displayName,
      event: eventRow.title,
      points: null,
    });
  } catch (error) {
    console.error(error);
    return new Response('Internal error', { status: 500 });
  }
}

async function markGuestAttended(
  admin: ReturnType<typeof createAdminClient>,
  eventId: string,
  email: string,
) {
  const { data: guestRows, error } = await admin
    .from('event_guests')
    .select('id, email, attended_at')
    .eq('event_id', eventId);

  if (error || !guestRows) return;

  const guest = guestRows.find((row) => normalizeEmail(String(row.email ?? '')) === email);
  if (!guest || guest.attended_at) return;

  await admin
    .from('event_guests')
    .update({ attended_at: new Date().toISOString(), confirmed: true })
    .eq('id', guest.id);
}
