import 'server-only';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

function adminKey() {
  return process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
}

export function isAdminClientConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && adminKey());
}

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = adminKey();

  if (!url || !key) {
    throw new Error(
      'Privileged Supabase access is not configured. Add SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY to the server environment.',
    );
  }

  return createSupabaseClient(
    url,
    key,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
