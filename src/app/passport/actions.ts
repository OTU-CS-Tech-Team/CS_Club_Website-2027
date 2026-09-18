'use server';

import QRCode from 'qrcode';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Mints a fresh, short-lived check-in token for the signed-in member and
// wipes any previous one — only one valid QR per person at a time, so a
// screenshotted/shared code goes stale in minutes instead of working all year.
export async function mintCheckinToken() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not signed in');
  }

  await supabase.from('checkin_tokens').delete().eq('user_id', user.id);

  const { data, error } = await supabase
    .from('checkin_tokens')
    .insert({ user_id: user.id })
    .select('token')
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'Could not create a check-in code');
  }

  const qrDataUrl = await QRCode.toDataURL(data.token);
  return { qrDataUrl };
}

// The browser uploads straight to Storage (its own RLS keeps members in their
// own folder); this just records the resulting public URL on the profile.
// Service-role write with an explicit ownership check, same pattern as the
// mailing list — no dependence on profiles' own policies.
export async function saveAvatarUrl(avatarUrl: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not signed in');
  }

  const expectedPrefix = `/storage/v1/object/public/avatars/${user.id}/`;
  if (!avatarUrl.includes(expectedPrefix)) {
    throw new Error('That image does not belong to your account.');
  }

  const { error } = await createAdminClient()
    .from('profiles')
    .update({ avatar_url: avatarUrl })
    .eq('id', user.id);

  if (error) {
    throw new Error(error.message || 'Could not save your photo.');
  }

  revalidatePath('/passport');
}
