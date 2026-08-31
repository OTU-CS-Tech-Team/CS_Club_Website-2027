'use server';

import { createClient } from '@/lib/supabase/server';

export async function toggleRsvp(eventId: string, wantRsvp: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not signed in');
  }

  if (wantRsvp) {
    await supabase.from('event_rsvps').insert({ event_id: eventId, user_id: user.id });
  } else {
    await supabase.from('event_rsvps').delete().eq('event_id', eventId).eq('user_id', user.id);
  }
}
