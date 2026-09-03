'use server';

import QRCode from 'qrcode';
import { createClient } from '@/lib/supabase/server';

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
