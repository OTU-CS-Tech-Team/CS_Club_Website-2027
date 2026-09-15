'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient, isAdminClientConfigured } from '@/lib/supabase/admin';
import { sendDirectEmail } from '@/lib/email';
import { mailingVerifyUrl, verifyMailingVerifyToken } from '@/lib/guestCancelToken';

export type MailingListResult = {
  ok: true;
  alreadySubscribed?: boolean;
  pendingVerification?: boolean;
};

const ALREADY_SUBSCRIBED = "You're already signed up for the mailing list!";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function findConfirmedSubscriber(email: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from('mailing_list_subscribers')
    .select('id')
    .eq('email', email)
    .eq('confirmed', true)
    .maybeSingle();
  return data?.id ?? null;
}

async function findPendingSubscriber(email: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from('mailing_list_subscribers')
    .select('id')
    .eq('email', email)
    .eq('confirmed', false)
    .maybeSingle();
  return data?.id ?? null;
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function sendMailingVerifyEmail(subscriberId: string, email: string, name: string) {
  const confirmUrl = mailingVerifyUrl({ subscriberId });
  const safeName = escapeHtml(name);
  const html = `
    <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;padding:24px;">
      <h1 style="font-size:20px;color:#111;">Confirm your mailing list signup</h1>
      <p style="color:#444;line-height:1.5;">Hi ${safeName}, click the link below to join the CS Club mailing list. You will not receive newsletters until you confirm.</p>
      <p><a href="${confirmUrl}" style="color:#111;font-weight:700;">Click here to confirm</a></p>
    </div>`;
  const text = `Confirm your mailing list signup\n\nHi ${name},\n\nConfirm here: ${confirmUrl}\n\nOTU Computer Science Club`;
  await sendDirectEmail(email, 'Confirm your CS Club mailing list signup', html, text);
}

export async function getMailingListStatus(): Promise<{
  signedIn: boolean;
  subscribed: boolean;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return { signedIn: false, subscribed: false };
  if (!isAdminClientConfigured()) return { signedIn: true, subscribed: false };

  const subscribed = Boolean(await findConfirmedSubscriber(normalizeEmail(user.email)));
  return { signedIn: true, subscribed };
}

export async function subscribeLoggedIn(): Promise<MailingListResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    throw new Error('Not signed in');
  }

  const email = normalizeEmail(user.email);
  if (await findConfirmedSubscriber(email)) {
    return { ok: true, alreadySubscribed: true };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .maybeSingle();

  const name =
    (profile?.full_name as string | null)?.trim() ||
    user.email.split('@')[0] ||
    'Member';

  const admin = createAdminClient();

  // Clear any unfinished guest opt-in for this email.
  await admin.from('mailing_list_subscribers').delete().eq('email', email).eq('confirmed', false);

  const { error } = await admin.from('mailing_list_subscribers').insert({
    name,
    email,
    confirmed: true,
  });

  if (error) {
    if (error.code === '23505') return { ok: true, alreadySubscribed: true };
    if (error.message.includes('confirmed') || error.code === 'PGRST204') {
      throw new Error(
        'Add a boolean column "confirmed" (default false) on mailing_list_subscribers in Supabase, then try again.',
      );
    }
    throw new Error(error.message || 'Could not join the mailing list.');
  }

  return { ok: true };
}

export async function subscribeGuest(name: string, email: string): Promise<MailingListResult> {
  const trimmedName = name.trim();
  const trimmedEmail = normalizeEmail(email);

  if (!trimmedName || !trimmedEmail) {
    throw new Error('Name and email are required.');
  }
  if (trimmedName.length > 160) {
    throw new Error('Name is too long.');
  }
  if (!isValidEmail(trimmedEmail)) {
    throw new Error('Enter a valid email address.');
  }

  if (await findConfirmedSubscriber(trimmedEmail)) {
    throw new Error(ALREADY_SUBSCRIBED);
  }

  const admin = createAdminClient();
  const pendingId = await findPendingSubscriber(trimmedEmail);
  if (pendingId) {
    await sendMailingVerifyEmail(pendingId, trimmedEmail, trimmedName);
    return { ok: true, pendingVerification: true };
  }

  const { data: row, error } = await admin
    .from('mailing_list_subscribers')
    .insert({
      name: trimmedName,
      email: trimmedEmail,
      confirmed: false,
    })
    .select('id')
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error(ALREADY_SUBSCRIBED);
    }
    if (error.message.includes('confirmed') || error.code === 'PGRST204') {
      throw new Error(
        'Add a boolean column "confirmed" (default false) on mailing_list_subscribers in Supabase, then try again.',
      );
    }
    throw new Error(error.message || 'Could not join the mailing list.');
  }

  if (!row?.id) {
    throw new Error('Could not start mailing list signup.');
  }

  try {
    await sendMailingVerifyEmail(String(row.id), trimmedEmail, trimmedName);
  } catch (err) {
    await admin.from('mailing_list_subscribers').delete().eq('id', row.id);
    throw err instanceof Error ? err : new Error('Could not send confirmation email.');
  }

  return { ok: true, pendingVerification: true };
}

export async function previewMailingConfirm(token: string) {
  const payload = verifyMailingVerifyToken(token);
  if (!payload) return { ok: false as const, message: 'This confirm link is invalid or expired.' };

  const admin = createAdminClient();
  const { data } = await admin
    .from('mailing_list_subscribers')
    .select('id, confirmed')
    .eq('id', payload.subscriberId)
    .maybeSingle();

  if (!data) return { ok: false as const, message: 'This signup could not be found.' };
  if (data.confirmed) return { ok: true as const, alreadyConfirmed: true as const };
  return { ok: true as const, alreadyConfirmed: false as const };
}

export async function confirmMailingSignup(token: string) {
  const payload = verifyMailingVerifyToken(token);
  if (!payload) return { ok: false as const, message: 'This confirm link is invalid or expired.' };

  const admin = createAdminClient();
  const { data } = await admin
    .from('mailing_list_subscribers')
    .select('id, confirmed')
    .eq('id', payload.subscriberId)
    .maybeSingle();

  if (!data) return { ok: false as const, message: 'This signup could not be found.' };

  if (!data.confirmed) {
    const { error } = await admin
      .from('mailing_list_subscribers')
      .update({ confirmed: true })
      .eq('id', data.id);
    if (error) return { ok: false as const, message: 'Could not confirm signup — try again.' };
  }

  return { ok: true as const, message: "You're on the mailing list." };
}

export async function confirmMailingSignupForm(formData: FormData) {
  const token = String(formData.get('token') ?? '');
  const result = await confirmMailingSignup(token);
  const params = new URLSearchParams({
    done: result.ok ? '1' : '0',
    msg: result.message,
  });
  redirect(`/mailing-list/confirm?${params.toString()}`);
}
