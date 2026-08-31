import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAdminEmail } from '@/lib/admin';

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isAdminEmail(user?.email)) {
    return new Response(null, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const token = typeof body?.token === 'string' ? body.token : '';
  const email = typeof body?.email === 'string' ? body.email.trim() : '';
  const eventId = typeof body?.eventId === 'string' ? body.eventId : '';

  if ((!token && !email) || !eventId) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    let userId: string;

    if (token) {
      // scanned path: resolve via the member's short-lived passport QR token
      const { data: tokenRow } = await admin
        .from('checkin_tokens')
        .select('user_id, expires_at')
        .eq('token', token)
        .single();

      if (!tokenRow || new Date(tokenRow.expires_at) < new Date()) {
        return NextResponse.json({ error: 'Invalid or expired code' }, { status: 400 });
      }

      // consume it immediately so the same scan can't be replayed
      await admin.from('checkin_tokens').delete().eq('token', token);
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

    const { error: insertError } = await admin.from('passport_stamps').insert({
      user_id: userId,
      label: eventRow.title,
      points: eventRow.points,
      event_id: eventId,
    });

    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json(
          { error: `${displayName} already checked in to this event` },
          { status: 409 }
        );
      }
      throw insertError;
    }

    return NextResponse.json({ name: displayName, points: eventRow.points });
  } catch (error) {
    console.error(error);
    return new Response('Internal error', { status: 500 });
  }
}
