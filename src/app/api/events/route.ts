import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('events')
    .select('id, title, description, location, starts_at, points')
    .order('starts_at', { ascending: true });

  if (error) {
    console.error(error);
    return NextResponse.json({ events: [] }, { status: 500 });
  }

  return NextResponse.json({ events: data ?? [] });
}
