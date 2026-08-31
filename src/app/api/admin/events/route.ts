import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAdminEmail } from '@/lib/admin';
import { torontoWallTime } from '@/lib/eventSchedule';

// The admin form's <input type="datetime-local"> sends a plain
// "YYYY-MM-DDTHH:mm" with no timezone — stored as-is, Postgres treats it
// as UTC, silently shifting every event ~4-5 hours earlier than intended.
// Interpret it as Toronto local time instead, matching the timezone the
// rest of the events code (eventSchedule.ts, dbEvents.ts) already assumes.
function torontoLocalToUtcIso(datetimeLocal: string): string | null {
  const match = datetimeLocal.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})/);
  if (!match) return null;
  const [, date, hours, minutes] = match;
  return torontoWallTime(date, Number(hours), Number(minutes)).toISOString();
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isAdminEmail(user?.email)) {
    return new Response(null, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const title = typeof body?.title === 'string' ? body.title.trim() : '';
  const description = typeof body?.description === 'string' ? body.description.trim() : null;
  const location = typeof body?.location === 'string' ? body.location.trim() : null;
  const startsAtRaw = typeof body?.startsAt === 'string' && body.startsAt ? body.startsAt : null;
  const startsAt = startsAtRaw ? torontoLocalToUtcIso(startsAtRaw) : null;
  const points = Number(body?.points);

  if (!title || !Number.isFinite(points) || points < 0) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('events')
      .insert({
        title,
        description,
        location,
        starts_at: startsAt,
        points,
        created_by: user!.id,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return new Response('Internal error', { status: 500 });
  }
}
