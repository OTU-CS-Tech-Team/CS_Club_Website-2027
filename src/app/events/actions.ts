'use server';

import { createClient } from '@/lib/supabase/server';
import { sendEventEmail } from '@/lib/email';
import { toDateString, toTimeString } from '@/lib/dbEvents';

export async function toggleRsvp(
  eventId: string,
  wantRsvp: boolean,
  yearOfStudy?: string,
  questions?: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not signed in');
  }

  if (wantRsvp) {
    const trimmedYear = (yearOfStudy ?? '').trim();
    if (!trimmedYear) {
      throw new Error('Year of study is required.');
    }

    const { error } = await supabase.from('event_rsvps').insert({
      event_id: eventId,
      user_id: user.id,
      year_of_study: trimmedYear,
      questions: questions?.trim() || null,
    });

    // email is best-effort and only makes sense once the RSVP actually
    // took (skip on error, e.g. already RSVP'd)
    if (!error && user.email) {
      const { data: event } = await supabase
        .from('events')
        .select('title, location, starts_at')
        .eq('id', eventId)
        .single();

      if (event) {
        const when = event.starts_at
          ? `${toDateString(event.starts_at)} at ${toTimeString(event.starts_at)}`
          : 'TBD';
        await sendEventEmail(user.email, `You're RSVP'd: ${event.title}`, {
          heading: "You're on the list!",
          intro: `You've successfully RSVP'd for the following event.`,
          title: event.title,
          when,
          location: event.location,
        });
      }
    }
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
