'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEventEmail } from '@/lib/email';
import { toDateString, toTimeString } from '@/lib/dbEvents';

export async function toggleRsvp(eventId: string, wantRsvp: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not signed in');
  }

  if (wantRsvp) {
    // upgrade a matching guest registration instead of leaving a stray
    // duplicate — someone who registered as a guest and then made an
    // account shouldn't end up counted twice for the same event
    if (user.email) {
      const admin = createAdminClient();
      await admin.from('event_guests').delete().eq('event_id', eventId).ilike('email', user.email);
    }

    const { error } = await supabase
      .from('event_rsvps')
      .insert({ event_id: eventId, user_id: user.id });

    if (error) {
      if (error.code === '23505') {
        throw new Error("You've already RSVP'd for this event.");
      }
      throw new Error('Could not RSVP — try again.');
    }

    if (user.email) {
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
// counted for attendance metrics, no points, no day-of confirmation. Email
// is captured so a later real signup with the same address can upgrade
// this into a proper RSVP instead of creating a duplicate (see toggleRsvp).
export async function registerGuest(
  eventId: string,
  name: string,
  studentId: string,
  email: string
) {
  const trimmedName = name.trim();
  const trimmedStudentId = studentId.trim();
  const trimmedEmail = email.trim();

  if (!trimmedName || !trimmedStudentId || !trimmedEmail) {
    throw new Error('Name, email, and student ID are required.');
  }

  const supabase = await createClient();
  const { error } = await supabase.from('event_guests').insert({
    event_id: eventId,
    name: trimmedName,
    student_id: trimmedStudentId,
    email: trimmedEmail,
  });

  if (error) {
    if (error.code === '23505') {
      throw new Error("You're already registered for this event.");
    }
    throw new Error('Could not register — try again.');
  }
}
