import { events as fallbackEvents } from '@/data/landing';
import type { ClubJob, ManagedEvent } from '@/types/content';
import { isMissingColumnError, presentJob } from './jobSections';
import { createClient } from './supabase/server';

const fallbackJob: ClubJob = {
  id: 'general-member',
  title: 'CS Club General Member',
  category: 'Community',
  description:
    "Bring your ideas, energy, and perspective to the team behind Ontario Tech's CS community.",
  is_active: true,
  closes_at: null,
  commitment: null,
  location: 'Ontario Tech',
};

type EventRow = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  starts_at: string | null;
  ends_at: string | null;
  images: string[] | null;
  points: number | null;
  is_published?: boolean;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
};

const CLUB_TZ = 'America/Toronto';

function datePart(iso: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: CLUB_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(iso));
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

function timePart(iso: string, hour12 = true) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: CLUB_TZ,
    hour: hour12 ? 'numeric' : '2-digit',
    minute: '2-digit',
    hour12,
  }).format(new Date(iso)).replace(String.fromCharCode(0x202f), ' ');
}

export function mapDatabaseEvent(row: EventRow): ManagedEvent | null {
  if (!row.starts_at) return null;
  const start = timePart(row.starts_at);
  const end = row.ends_at ? timePart(row.ends_at) : '';
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    date: datePart(row.starts_at),
    time: end ? `${start} - ${end}` : start,
    location: row.location ?? 'TBD',
    images: row.images ?? [],
    starts_at: row.starts_at,
    ends_at: row.ends_at,
    start_time: timePart(row.starts_at, false),
    end_time: row.ends_at ? timePart(row.ends_at, false) : '',
    points: row.points ?? 0,
    is_published: row.is_published ?? true,
    created_by: row.created_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function getPublishedEvents(): Promise<ManagedEvent[]> {
  const supabase = await createClient();
  const result = await supabase
    .from('events')
    .select('id, title, description, location, starts_at, ends_at, images, points, is_published, created_by, created_at, updated_at')
    .eq('is_published', true)
    .not('starts_at', 'is', null)
    .order('starts_at');
  let rows: EventRow[] | null = result.data as EventRow[] | null;
  let error = result.error;
  if (result.error?.code === '42703') {
    const legacyResult = await supabase
      .from('events')
      .select('id, title, description, location, starts_at, ends_at, images, points, created_by, created_at, updated_at')
      .not('starts_at', 'is', null)
      .order('starts_at');
    rows = legacyResult.data as EventRow[] | null;
    error = legacyResult.error;
  }
  if (error) {
    if (!['42703', 'PGRST205'].includes(error.code)) {
      console.error('Unable to load events', { code: error.code, message: error.message });
    }
    return fallbackEvents;
  }
  return (rows ?? []).map(mapDatabaseEvent).filter((event): event is ManagedEvent => event !== null);
}

export async function getActiveJobs(): Promise<ClubJob[]> {
  const supabase = await createClient();
  const result = await supabase
    .from('jobs')
    .select('id, title, category, description, is_active, closes_at, commitment, location, sections, created_by, created_at, updated_at')
    .eq('is_active', true)
    .or(`closes_at.is.null,closes_at.gt.${new Date().toISOString()}`)
    .order('created_at');
  let rows: ClubJob[] | null = result.data as ClubJob[] | null;
  let error = result.error;
  if (isMissingColumnError(result.error)) {
    const currentResult = await supabase
      .from('jobs')
      .select('id, title, category, description, is_active, closes_at, commitment, location, created_by, created_at, updated_at')
      .eq('is_active', true)
      .or(`closes_at.is.null,closes_at.gt.${new Date().toISOString()}`)
      .order('created_at');
    rows = currentResult.data as ClubJob[] | null;
    error = currentResult.error;
    if (isMissingColumnError(currentResult.error)) {
      const legacyResult = await supabase
        .from('jobs')
        .select('id, title, category, description, is_active, created_by, created_at, updated_at')
        .eq('is_active', true)
        .order('created_at');
      rows = legacyResult.data as ClubJob[] | null;
      error = legacyResult.error;
    }
  }
  if (error) {
    if (!['42703', 'PGRST205'].includes(error.code)) {
      console.error('Unable to load jobs', { code: error.code, message: error.message });
    }
    return [fallbackJob];
  }
  return (rows ?? []).map((row) => {
    const record = row as ClubJob & { sections?: unknown };
    const { sections, ...job } = record;
    return { ...job, ...presentJob(job.description ?? '', sections) };
  });
}

export async function getActiveJob(id: string): Promise<ClubJob | null> {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) return null;
  const jobs = await getActiveJobs();
  return jobs.find((job) => job.id === id) ?? null;
}
