'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEventEmail } from '@/lib/email';
import { toDateString, toTimeString } from '@/lib/dbEvents';
import {
  guestCancelUrl,
  guestVerifyUrl,
  verifyGuestCancelToken,
  verifyGuestVerifyToken,
} from '@/lib/guestCancelToken';

export type RsvpResult = {
  ok: true;
  emailSent: boolean;
  emailWarning?: string;
  alreadyRegistered?: boolean;
  pendingVerification?: boolean;
};

const ALREADY_RSVPED = "You've already RSVP'd!";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function loadEventDetails(eventId: string) {
  const supabase = await createClient();
  const { data: event } = await supabase
    .from('events')
    .select('title, location, starts_at')
    .eq('id', eventId)
    .single();
  return event;
}

function eventWhen(startsAt: string | null) {
  return startsAt ? `${toDateString(startsAt)} at ${toTimeString(startsAt)}` : 'TBD';
}

async function findMemberRsvpUserId(eventId: string, email: string) {
  const admin = createAdminClient();
  const { data: rsvps } = await admin.from('event_rsvps').select('user_id').eq('event_id', eventId);
  const userIds = (rsvps ?? []).map((row) => row.user_id as string);
  if (userIds.length === 0) return null;

  const { data: profiles } = await admin.from('profiles').select('id, email').in('id', userIds);
  const match = (profiles ?? []).find(
    (profile) => normalizeEmail(String(profile.email ?? '')) === email,
  );
  return match?.id ?? null;
}

/** Confirmed guest RSVPs only — unconfirmed pending rows do not count. */
async function findConfirmedGuest(eventId: string, email: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from('event_guests')
    .select('id')
    .eq('event_id', eventId)
    .eq('email', email)
    .eq('confirmed', true)
    .maybeSingle();
  return data?.id ?? null;
}

async function findPendingGuest(eventId: string, email: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from('event_guests')
    .select('id')
    .eq('event_id', eventId)
    .eq('email', email)
    .eq('confirmed', false)
    .maybeSingle();
  return data?.id ?? null;
}

export async function getLoggedInRsvpState(eventId: string): Promise<{ rsvped: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { rsvped: false };

  const { data: existing } = await supabase
    .from('event_rsvps')
    .select('event_id')
    .eq('event_id', eventId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existing) return { rsvped: true };

  const email = user.email ? normalizeEmail(user.email) : '';
  if (!email) return { rsvped: false };

  const guestId = await findConfirmedGuest(eventId, email);
  return { rsvped: Boolean(guestId) };
}

export async function toggleRsvp(eventId: string, wantRsvp: boolean): Promise<RsvpResult | void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not signed in');
  }

  if (wantRsvp) {
    const admin = createAdminClient();
    const email = user.email ? normalizeEmail(user.email) : '';

    if (email) {
      const existingGuestId = await findConfirmedGuest(eventId, email);
      if (existingGuestId) {
        const { error: upgradeError } = await supabase
          .from('event_rsvps')
          .insert({ event_id: eventId, user_id: user.id });
        if (upgradeError && upgradeError.code !== '23505') {
          throw new Error(upgradeError.message || 'Could not RSVP — try again.');
        }
        await admin.from('event_guests').delete().eq('id', existingGuestId);
        return { ok: true, emailSent: false, alreadyRegistered: true };
      }
      // Drop any unfinished guest verify for this email so member RSVP is clean.
      await admin
        .from('event_guests')
        .delete()
        .eq('event_id', eventId)
        .eq('email', email)
        .eq('confirmed', false);
    }

    const { error } = await supabase
      .from('event_rsvps')
      .insert({ event_id: eventId, user_id: user.id });

    if (error) {
      if (error.code === '23505') {
        throw new Error(ALREADY_RSVPED);
      }
      throw new Error(error.message || 'Could not RSVP — try again.');
    }

    if (!user.email) {
      return {
        ok: true,
        emailSent: false,
        emailWarning: "You're going, but your account has no email for a confirmation.",
      };
    }

    const event = await loadEventDetails(eventId);
    if (!event) {
      return {
        ok: true,
        emailSent: false,
        emailWarning: "You're going, but we couldn't load the event to email a confirmation.",
      };
    }

    const mail = await sendEventEmail(user.email, `You're RSVP'd: ${event.title}`, {
      heading: "You're on the list!",
      intro: `You've successfully RSVP'd for the following event.`,
      title: event.title,
      when: eventWhen(event.starts_at),
      location: event.location,
    });

    if (!mail.sent) {
      return {
        ok: true,
        emailSent: false,
        emailWarning: `You're going, but the confirmation email failed${mail.error ? `: ${mail.error}` : '.'}`,
      };
    }

    return { ok: true, emailSent: true };
  }

  const { error } = await supabase
    .from('event_rsvps')
    .delete()
    .eq('event_id', eventId)
    .eq('user_id', user.id);

  if (error) {
    throw new Error(error.message || 'Could not cancel RSVP — try again.');
  }

  if (user.email) {
    const admin = createAdminClient();
    await admin
      .from('event_guests')
      .delete()
      .eq('event_id', eventId)
      .eq('email', normalizeEmail(user.email));
  }
}

async function sendGuestVerifyEmail(opts: {
  guestId: string;
  eventId: string;
  email: string;
  name: string;
}) {
  const event = await loadEventDetails(opts.eventId);
  if (!event) {
    return { sent: false, error: 'Could not load event details.' };
  }
  const confirmUrl = guestVerifyUrl({ guestId: opts.guestId, eventId: opts.eventId });
  return sendEventEmail(opts.email, `Confirm your RSVP: ${event.title}`, {
    heading: 'Confirm your RSVP',
    intro: `Thanks ${opts.name} — click the link below to confirm you're attending. This RSVP does not count until you confirm.`,
    title: event.title,
    when: eventWhen(event.starts_at),
    location: event.location,
    confirmUrl,
  });
}

export async function registerGuest(
  eventId: string,
  name: string,
  studentId: string,
  email: string,
): Promise<RsvpResult> {
  const trimmedName = name.trim();
  const trimmedStudentId = studentId.trim();
  const trimmedEmail = normalizeEmail(email);

  if (!trimmedName || !trimmedStudentId || !trimmedEmail) {
    throw new Error('Name, student ID, and email are required.');
  }
  if (!isValidEmail(trimmedEmail)) {
    throw new Error('Enter a valid email address.');
  }

  const admin = createAdminClient();

  if (await findMemberRsvpUserId(eventId, trimmedEmail)) {
    throw new Error(ALREADY_RSVPED);
  }
  if (await findConfirmedGuest(eventId, trimmedEmail)) {
    throw new Error(ALREADY_RSVPED);
  }

  const pendingId = await findPendingGuest(eventId, trimmedEmail);
  if (pendingId) {
    const mail = await sendGuestVerifyEmail({
      guestId: pendingId,
      eventId,
      email: trimmedEmail,
      name: trimmedName,
    });
    if (!mail.sent) {
      return {
        ok: true,
        emailSent: false,
        pendingVerification: true,
        emailWarning: `Check your email to confirm — resend failed${mail.error ? `: ${mail.error}` : '.'}`,
      };
    }
    return { ok: true, emailSent: true, pendingVerification: true };
  }

  const { data: guest, error } = await admin
    .from('event_guests')
    .insert({
      event_id: eventId,
      name: trimmedName,
      student_id: trimmedStudentId,
      email: trimmedEmail,
      confirmed: false,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Unable to register guest', { code: error.code, message: error.message });
    if (error.code === '23505') {
      throw new Error(ALREADY_RSVPED);
    }
    if (error.message.includes('confirmed') || error.code === 'PGRST204') {
      throw new Error(
        'Add a boolean column "confirmed" (default false) on event_guests in Supabase, then try again.',
      );
    }
    if (error.message.includes("'email'") || error.code === 'PGRST204') {
      throw new Error(
        'Guest signup needs an email column on event_guests. Apply the latest database migration and try again.',
      );
    }
    throw new Error(error.message || 'Could not register — try again.');
  }

  if (!guest?.id) {
    return {
      ok: true,
      emailSent: false,
      pendingVerification: true,
      emailWarning: 'Could not start verification — try again.',
    };
  }

  const mail = await sendGuestVerifyEmail({
    guestId: guest.id,
    eventId,
    email: trimmedEmail,
    name: trimmedName,
  });

  if (!mail.sent) {
    await admin.from('event_guests').delete().eq('id', guest.id);
    return {
      ok: true,
      emailSent: false,
      pendingVerification: true,
      emailWarning: `Could not send confirmation email${mail.error ? `: ${mail.error}` : '.'}`,
    };
  }

  return { ok: true, emailSent: true, pendingVerification: true };
}

export async function previewGuestVerify(token: string) {
  const payload = verifyGuestVerifyToken(token);
  if (!payload) return { ok: false as const, message: 'This confirm link is invalid or expired.' };

  const admin = createAdminClient();
  const { data: guest } = await admin
    .from('event_guests')
    .select('id, event_id, confirmed, name, email')
    .eq('id', payload.guestId)
    .eq('event_id', payload.eventId)
    .maybeSingle();

  if (!guest) return { ok: false as const, message: 'This RSVP could not be found.' };
  if (guest.confirmed) return { ok: true as const, alreadyConfirmed: true as const };

  return { ok: true as const, alreadyConfirmed: false as const };
}

export async function confirmGuestRsvp(token: string) {
  const payload = verifyGuestVerifyToken(token);
  if (!payload) return { ok: false as const, message: 'This confirm link is invalid or expired.' };

  const admin = createAdminClient();
  const { data: guest } = await admin
    .from('event_guests')
    .select('id, event_id, confirmed, name, email')
    .eq('id', payload.guestId)
    .eq('event_id', payload.eventId)
    .maybeSingle();

  if (!guest) return { ok: false as const, message: 'This RSVP could not be found.' };

  if (!guest.confirmed) {
    const { error } = await admin.from('event_guests').update({ confirmed: true }).eq('id', guest.id);
    if (error) return { ok: false as const, message: 'Could not confirm your RSVP — try again.' };
  }

  const event = await loadEventDetails(guest.event_id);
  if (event && guest.email) {
    const cancelUrl = guestCancelUrl({ guestId: guest.id, eventId: guest.event_id });
    await sendEventEmail(String(guest.email), `You're registered: ${event.title}`, {
      heading: "You're on the list!",
      intro: `Thanks ${guest.name ?? ''} — your RSVP is confirmed.`,
      title: event.title,
      when: eventWhen(event.starts_at),
      location: event.location,
      cancelUrl,
    });
  }

  return { ok: true as const, message: 'Your RSVP is confirmed. See you there!' };
}

export async function confirmGuestRsvpForm(formData: FormData) {
  const token = String(formData.get('token') ?? '');
  const result = await confirmGuestRsvp(token);
  const params = new URLSearchParams({
    done: result.ok ? '1' : '0',
    msg: result.message,
  });
  redirect(`/events/guest-confirm?${params.toString()}`);
}

export async function previewGuestCancel(token: string) {
  const payload = verifyGuestCancelToken(token);
  if (!payload) {
    return { ok: false as const, message: 'This cancel link is invalid or expired.' };
  }

  const admin = createAdminClient();
  const { data: guest } = await admin
    .from('event_guests')
    .select('id, event_id, confirmed')
    .eq('id', payload.guestId)
    .eq('event_id', payload.eventId)
    .eq('confirmed', true)
    .maybeSingle();

  if (!guest) {
    return { ok: false as const, message: "This RSVP was already cancelled or couldn't be found." };
  }

  return { ok: true as const, eventId: guest.event_id as string };
}

export async function cancelGuestRsvp(token: string) {
  const payload = verifyGuestCancelToken(token);
  if (!payload) {
    return { ok: false as const, message: 'This cancel link is invalid or expired.' };
  }

  const admin = createAdminClient();
  const { data: guest } = await admin
    .from('event_guests')
    .select('id, event_id')
    .eq('id', payload.guestId)
    .eq('event_id', payload.eventId)
    .eq('confirmed', true)
    .maybeSingle();

  if (!guest) {
    return { ok: false as const, message: "This RSVP was already cancelled or couldn't be found." };
  }

  const { error } = await admin.from('event_guests').delete().eq('id', guest.id);
  if (error) {
    return { ok: false as const, message: 'Could not cancel your RSVP — try again.' };
  }

  return { ok: true as const, message: 'Your RSVP has been cancelled.' };
}

export async function cancelGuestRsvpForm(formData: FormData) {
  const token = String(formData.get('token') ?? '');
  const result = await cancelGuestRsvp(token);
  const params = new URLSearchParams({
    done: result.ok ? '1' : '0',
    msg: result.message,
  });
  redirect(`/events/guest-cancel?${params.toString()}`);
}
