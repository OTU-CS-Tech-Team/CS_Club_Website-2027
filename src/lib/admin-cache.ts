import 'server-only';

import { unstable_cache } from 'next/cache';
import { createAdminClient, isAdminClientConfigured } from '@/lib/supabase/admin';
import { mapDatabaseEvent } from '@/lib/content';
import { getMailingListSubscribers, type MailingListSubscriber } from '@/lib/members';
import { NEWSLETTER_HISTORY_LIMIT } from '@/lib/newsletters';
import { isMissingColumnError, presentJob } from '@/lib/jobSections';
import type { ClubJob, ManagedEvent } from '@/types/content';
import type { SupabaseClient } from '@supabase/supabase-js';

export const ADMIN_CACHE_TAGS = {
  events: 'admin-events',
  jobs: 'admin-jobs',
  subscribers: 'admin-subscribers',
  newsletters: 'admin-newsletters',
} as const;

const CACHE_REVALIDATE_SECONDS = 300;

async function fetchEventsInternal(supabase: SupabaseClient): Promise<{ events: ManagedEvent[]; error: string }> {
  const eventsResult = await supabase
    .from('events')
    .select('id, title, description, location, starts_at, ends_at, images, points, is_published, created_by, created_at, updated_at')
    .order('starts_at', { ascending: false });

  if (eventsResult.error?.code === '42703') {
    const legacyEventsResult = await supabase
      .from('events')
      .select('id, title, description, location, starts_at, ends_at, images, points, created_by, created_at, updated_at')
      .order('starts_at', { ascending: false });
    const eventRows = (legacyEventsResult.data ?? [])
      .map(mapDatabaseEvent)
      .filter((event): event is ManagedEvent => event !== null);
    if (legacyEventsResult.error) {
      console.error('Unable to load dashboard events', {
        code: legacyEventsResult.error.code,
        message: legacyEventsResult.error.message,
      });
      return { events: [], error: 'Events could not be loaded. Refresh the page and try again.' };
    }
    return { events: eventRows, error: '' };
  }

  const eventRows = (eventsResult.data ?? [])
    .map(mapDatabaseEvent)
    .filter((event): event is ManagedEvent => event !== null);
  if (eventsResult.error) {
    console.error('Unable to load dashboard events', {
      code: eventsResult.error.code,
      message: eventsResult.error.message,
    });
    return { events: [], error: 'Events could not be loaded. Refresh the page and try again.' };
  }
  return { events: eventRows, error: '' };
}

async function fetchJobsInternal(supabase: SupabaseClient): Promise<{ jobs: ClubJob[]; error: string }> {
  const jobsResult = await supabase
    .from('jobs')
    .select('id, title, category, description, is_active, closes_at, commitment, location, sections, created_by, created_at, updated_at')
    .order('created_at', { ascending: false });

  if (isMissingColumnError(jobsResult.error)) {
    const currentJobsResult = await supabase
      .from('jobs')
      .select('id, title, category, description, is_active, closes_at, commitment, location, created_by, created_at, updated_at')
      .order('created_at', { ascending: false });
    let fallbackRows = currentJobsResult.data as ClubJob[] | null;
    let fallbackError = currentJobsResult.error;
    if (isMissingColumnError(currentJobsResult.error)) {
      const legacyJobsResult = await supabase
        .from('jobs')
        .select('id, title, category, description, is_active, created_by, created_at, updated_at')
        .order('created_at', { ascending: false });
      fallbackRows = legacyJobsResult.data as ClubJob[] | null;
      fallbackError = legacyJobsResult.error;
    }
    const jobRows = ((fallbackRows ?? []) as Array<ClubJob & { sections?: unknown }>).map((job) => {
      const { sections, ...rest } = job;
      return { ...rest, ...presentJob(rest.description ?? '', sections) };
    });
    if (fallbackError) {
      console.error('Unable to load dashboard jobs', {
        code: fallbackError.code,
        message: fallbackError.message,
      });
      return { jobs: [], error: 'Jobs could not be loaded. Refresh the page and try again.' };
    }
    return { jobs: jobRows, error: '' };
  }

  const jobRows = ((jobsResult.data ?? []) as Array<ClubJob & { sections?: unknown }>).map((job) => {
    const { sections, ...rest } = job;
    return { ...rest, ...presentJob(rest.description ?? '', sections) };
  });
  if (jobsResult.error) {
    console.error('Unable to load dashboard jobs', {
      code: jobsResult.error.code,
      message: jobsResult.error.message,
    });
    return { jobs: [], error: 'Jobs could not be loaded. Refresh the page and try again.' };
  }
  return { jobs: jobRows, error: '' };
}

async function fetchSubscribersInternal(): Promise<MailingListSubscriber[]> {
  if (!isAdminClientConfigured()) return [];
  const adminClient = createAdminClient();
  return getMailingListSubscribers(adminClient);
}

type SentNewsletter = { id: string; subject: string; recipient_count: number; sent_at: string };

async function fetchNewslettersInternal(): Promise<SentNewsletter[]> {
  if (!isAdminClientConfigured()) return [];
  const adminClient = createAdminClient();
  const newslettersResult = await adminClient
    .from('newsletters')
    .select('id, subject, recipient_count, sent_at')
    .order('sent_at', { ascending: false })
    .limit(NEWSLETTER_HISTORY_LIMIT);
  return newslettersResult.data ?? [];
}

export const getCachedEvents = unstable_cache(
  async (supabaseUrl: string) => {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    return fetchEventsInternal(supabase);
  },
  ['admin-events'],
  { tags: [ADMIN_CACHE_TAGS.events], revalidate: CACHE_REVALIDATE_SECONDS }
);

export const getCachedJobs = unstable_cache(
  async (supabaseUrl: string) => {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    return fetchJobsInternal(supabase);
  },
  ['admin-jobs'],
  { tags: [ADMIN_CACHE_TAGS.jobs], revalidate: CACHE_REVALIDATE_SECONDS }
);

export const getCachedSubscribers = unstable_cache(
  async () => fetchSubscribersInternal(),
  ['admin-subscribers'],
  { tags: [ADMIN_CACHE_TAGS.subscribers], revalidate: CACHE_REVALIDATE_SECONDS }
);

export const getCachedNewsletters = unstable_cache(
  async () => fetchNewslettersInternal(),
  ['admin-newsletters'],
  { tags: [ADMIN_CACHE_TAGS.newsletters], revalidate: CACHE_REVALIDATE_SECONDS }
);

export async function getCreatorEmailsBatched(
  creatorIds: string[],
  currentUserEmail: string | undefined,
  currentUserId: string
): Promise<Record<string, string>> {
  const creatorEmails: Record<string, string> = {};
  if (currentUserEmail) creatorEmails[currentUserId] = currentUserEmail;
  
  if (!isAdminClientConfigured() || creatorIds.length === 0) {
    return creatorEmails;
  }

  const adminClient = createAdminClient();
  const uniqueIds = Array.from(new Set(creatorIds.filter((id) => id !== currentUserId)));
  
  if (uniqueIds.length === 0) {
    return creatorEmails;
  }

  const { data: profiles } = await adminClient
    .from('profiles')
    .select('id, email')
    .in('id', uniqueIds);

  for (const profile of profiles ?? []) {
    if (profile.email) {
      creatorEmails[profile.id] = profile.email;
    }
  }

  return creatorEmails;
}
