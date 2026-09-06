'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { torontoWallTime } from '@/lib/eventSchedule';
import { sendBulkEmail, sendDirectEmail, newsletterEmailHtml, newsletterEmailText } from '@/lib/email';
import { getMailingListEmails } from '@/lib/members';
import { pruneNewsletterHistory } from '@/lib/newsletters';

export type AdminActionState = {
  ok: boolean;
  message: string;
};

const initialError = (message: string): AdminActionState => ({ ok: false, message });

function text(formData: FormData, field: string) {
  return String(formData.get(field) ?? '').trim();
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100);
}

function validImageUrl(value: string) {
  return (value.startsWith('/') && !value.startsWith('//')) || /^https:\/\/[^\s]+$/i.test(value);
}

function validDate(value: string) {
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function torontoDateTime(date: string, time: string) {
  const match = time.match(/^(\d{2}):(\d{2})$/);
  if (!match) return null;
  return torontoWallTime(date, Number(match[1]), Number(match[2]));
}

async function requireAdmin() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) throw new Error('UNAUTHENTICATED');

  const { data: admin } = await supabase
    .from('admin_users')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!admin) throw new Error('UNAUTHORIZED');

  return { supabase, user };
}

function authorizationError(error: unknown) {
  if (error instanceof Error && error.message === 'UNAUTHENTICATED') {
    return 'Your session has expired. Sign in again.';
  }
  if (error instanceof Error && error.message === 'UNAUTHORIZED') {
    return 'This account is not authorized.';
  }
  return null;
}

function publicErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message: unknown }).message;
    if (typeof message === 'string' && message.trim()) return message;
  }
  return null;
}

export async function saveEvent(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const originalId = text(formData, 'originalId');
  const title = text(formData, 'title');
  const description = text(formData, 'description');
  const date = text(formData, 'date');
  const startTime = text(formData, 'startTime');
  const endTime = text(formData, 'endTime');
  const location = text(formData, 'location');
  const points = Number(text(formData, 'points'));
  const images = text(formData, 'images')
    .split(/[\n,]/)
    .map((value) => value.trim())
    .filter(Boolean);
  const startsAt = torontoDateTime(date, startTime);
  const endsAt = torontoDateTime(date, endTime);

  if (!title || !description || !date || !startTime || !endTime || !location) {
    return initialError('Complete every required event field.');
  }
  if (originalId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(originalId)) {
    return initialError('The event identifier is invalid.');
  }
  if (title.length > 160 || description.length > 5000 || location.length > 200) {
    return initialError('One or more event fields are too long.');
  }
  if (!validDate(date) || !startsAt || !endsAt || endsAt <= startsAt || !Number.isInteger(points) || points < 0 || points > 1000 || images.length > 6 || images.some((url) => !validImageUrl(url))) {
    return initialError('Check the event date, times, points, and image URLs. End time must be after start time.');
  }

  try {
    const { supabase, user } = await requireAdmin();
    const payload = {
      title,
      description,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      location,
      points,
      images,
      updated_at: new Date().toISOString(),
      ...(!originalId ? { created_by: user.id } : {}),
    };
    const query = originalId
      ? supabase.from('events').update(payload).eq('id', originalId)
      : supabase.from('events').insert(payload);
    const { error } = await query;
    if (error) {
      console.error('Unable to save event', { code: error.code, message: error.message });
      return initialError(error.code === '23505' ? 'An event with this title already exists.' : 'Unable to save the event.');
    }
  } catch (error) {
    return initialError(authorizationError(error) ?? 'Unable to save the event.');
  }

  revalidatePath('/');
  revalidatePath('/events');
  revalidatePath('/admin');
  return { ok: true, message: originalId ? 'Event updated.' : 'Event created.' };
}

export async function deleteEvent(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const id = text(formData, 'id');
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) return initialError('The event identifier is invalid.');
  try {
    const { supabase } = await requireAdmin();
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) {
      console.error('Unable to delete event', { code: error.code, message: error.message });
      return initialError('Unable to delete the event.');
    }
  } catch (error) {
    return initialError(authorizationError(error) ?? 'Unable to delete the event.');
  }
  revalidatePath('/');
  revalidatePath('/events');
  revalidatePath('/admin');
  return { ok: true, message: 'Event deleted.' };
}

export async function saveJob(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const originalId = text(formData, 'originalId');
  const title = text(formData, 'title');
  const category = text(formData, 'category');
  const description = text(formData, 'description');
  const id = originalId || slugify(title);
  const isActive = formData.get('isActive') === 'on';

  if (!id || !title || !category || !description) return initialError('Complete every required job field.');
  if (title.length > 160 || category.length > 80 || description.length > 5000) {
    return initialError('One or more job fields are too long.');
  }

  try {
    const { supabase, user } = await requireAdmin();
    const payload = {
      id,
      title,
      category,
      description,
      is_active: isActive,
      updated_at: new Date().toISOString(),
      ...(!originalId ? { created_by: user.id } : {}),
    };
    const query = originalId
      ? supabase.from('jobs').update(payload).eq('id', originalId)
      : supabase.from('jobs').insert(payload);
    const { error } = await query;
    if (error) {
      console.error('Unable to save job', { code: error.code, message: error.message });
      return initialError(error.code === '23505' ? 'A job with this title already exists.' : 'Unable to save the job.');
    }
  } catch (error) {
    return initialError(authorizationError(error) ?? 'Unable to save the job.');
  }

  revalidatePath('/careers');
  revalidatePath('/admin');
  return { ok: true, message: originalId ? 'Job updated.' : 'Job created.' };
}

export async function deleteJob(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const id = text(formData, 'id');
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) return initialError('The job identifier is invalid.');
  try {
    const { supabase } = await requireAdmin();
    const { error } = await supabase.from('jobs').delete().eq('id', id);
    if (error) {
      console.error('Unable to delete job', { code: error.code, message: error.message });
      return initialError('Unable to delete the job.');
    }
  } catch (error) {
    return initialError(authorizationError(error) ?? 'Unable to delete the job.');
  }
  revalidatePath('/careers');
  revalidatePath('/admin');
  return { ok: true, message: 'Job deleted.' };
}

export async function sendNewsletter(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const subject = text(formData, 'subject');
  const body = text(formData, 'body');
  const intent = text(formData, 'intent');

  if (!subject || !body) return initialError('Enter a subject and body.');
  if (subject.length > 200) return initialError('Subject is too long.');
  if (body.length > 20000) return initialError('Body is too long.');
  if (intent !== 'test' && intent !== 'send') return initialError('Choose a test send or a full send.');

  try {
    const { user } = await requireAdmin();
    const html = newsletterEmailHtml({ subject, body });
    const plainText = newsletterEmailText({ subject, body });

    if (intent === 'test') {
      if (!user.email) return initialError('Your account has no email on file.');
      await sendDirectEmail(user.email, `[TEST] ${subject}`, html, plainText);
      return { ok: true, message: `Test sent to ${user.email} — check your inbox (and spam).` };
    }

    const admin = createAdminClient();
    const recipients = await getMailingListEmails(admin);
    if (recipients.length === 0) {
      return initialError('No mailing list subscribers to send to. Someone must sign up on the homepage first.');
    }

    const { sent, failed } = await sendBulkEmail(recipients, subject, html, plainText);
    if (sent === 0) return initialError('Sending failed — nobody received this newsletter.');

    const { error } = await admin.from('newsletters').insert({
      subject,
      body,
      sent_by: user.id,
      recipient_count: sent,
    });
    if (error) {
      console.error('Unable to record newsletter', { code: error.code, message: error.message });
      return {
        ok: true,
        message: failed > 0
          ? `Sent to ${sent} subscriber(s) — ${failed} failed. History was not saved (${error.message}).`
          : `Sent to ${sent} subscriber(s). History was not saved (${error.message}).`,
      };
    }

    await pruneNewsletterHistory(admin);
    revalidatePath('/admin');
    return {
      ok: true,
      message: failed > 0
        ? `Sent to ${sent} subscriber(s) — ${failed} failed.`
        : `Sent to ${sent} subscriber(s): ${recipients.slice(0, 3).join(', ')}${recipients.length > 3 ? '…' : ''}`,
    };
  } catch (error) {
    return initialError(authorizationError(error) ?? publicErrorMessage(error) ?? 'Could not send the newsletter.');
  }
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
