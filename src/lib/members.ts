import type { SupabaseClient } from '@supabase/supabase-js';

export type MailingListSubscriber = {
  id: string | number;
  name: string;
  email: string;
};

// Only confirmed double-opt-in subscribers receive newsletters.
export async function getMailingListSubscribers(
  supabase: SupabaseClient,
): Promise<MailingListSubscriber[]> {
  const { data, error } = await supabase
    .from('mailing_list_subscribers')
    .select('id, name, email')
    .eq('confirmed', true)
    .order('email', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const seen = new Set<string>();
  const subscribers: MailingListSubscriber[] = [];
  for (const row of data ?? []) {
    const email = (row.email as string | null)?.toLowerCase().trim();
    if (!email || seen.has(email)) continue;
    seen.add(email);
    subscribers.push({
      id: row.id as string | number,
      name: String(row.name ?? '').trim() || '—',
      email,
    });
  }
  return subscribers;
}

export async function getMailingListEmails(supabase: SupabaseClient): Promise<string[]> {
  const subscribers = await getMailingListSubscribers(supabase);
  return subscribers.map((row) => row.email);
}

/** @deprecated Prefer getMailingListEmails */
export async function getGeneralMemberEmails(supabase: SupabaseClient): Promise<string[]> {
  return getMailingListEmails(supabase);
}
