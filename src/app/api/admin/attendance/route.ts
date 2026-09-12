import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAdmin } from '@/lib/admin';

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
  const email = typeof body?.email === 'string' ? body.email.trim() : '';
  const eventId = typeof body?.eventId === 'string' ? body.eventId : '';
  // preview: resolve who the code belongs to and which event, but don't
  // record anything — lets the admin see a name before they confirm.
  const preview = body?.preview === true;

  if ((!token && !email) || !eventId) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    let userId: string;

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
    } else {
      // manual fallback: resolve by email for members who didn't scan
      const { data: profileMatch } = await admin
        .from('profiles')
        .select('id')
        .ilike('email', email)
        .single();

      if (!profileMatch) {
        return NextResponse.json({ error: 'No member found with that email' }, { status: 404 });
      }
      userId = profileMatch.id;
    }

    const [{ data: profile }, { data: eventRow }] = await Promise.all([
      admin.from('profiles').select('full_name, email').eq('id', userId).single(),
      admin.from('events').select('title, points').eq('id', eventId).single(),
    ]);

    if (!eventRow) {
      return NextResponse.json({ error: 'Event not found' }, { status: 400 });
    }

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
        { status: 409 }
      );
    }

    if (insertError) {
      throw insertError;
    }

    return NextResponse.json({
      name: displayName,
      event: eventRow.title,
      points: eventRow.points,
    });
  } catch (error) {
    console.error(error);
    return new Response('Internal error', { status: 500 });
  }
}
