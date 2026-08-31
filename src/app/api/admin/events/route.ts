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
  const title = typeof body?.title === 'string' ? body.title.trim() : '';
  const description = typeof body?.description === 'string' ? body.description.trim() : null;
  const location = typeof body?.location === 'string' ? body.location.trim() : null;
  const startsAt = typeof body?.startsAt === 'string' && body.startsAt ? body.startsAt : null;
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
