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

// No account needed — this is the full guest interaction: one submission,
// counted for attendance metrics, no points, no day-of confirmation.
export async function registerGuest(eventId: string, name: string, studentId: string) {
  const trimmedName = name.trim();
  const trimmedStudentId = studentId.trim();

  if (!trimmedName || !trimmedStudentId) {
    throw new Error('Name and student ID are required.');
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('event_guests')
    .insert({ event_id: eventId, name: trimmedName, student_id: trimmedStudentId });

  if (error) {
    if (error.code === '23505') {
      throw new Error("You're already registered for this event.");
    }
    throw new Error('Could not register — try again.');
  }
}
