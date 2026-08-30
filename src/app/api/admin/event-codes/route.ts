import { randomBytes } from 'crypto';
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
  const label = typeof body?.label === 'string' ? body.label.trim() : '';
  const points = Number(body?.points);

  if (!label || !Number.isFinite(points) || points < 0) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }

  try {
    const code = randomBytes(6).toString('hex');
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('event_codes')
      .insert({ code, label, points, created_by: user!.id })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return new Response('Internal error', { status: 500 });
  }
}
