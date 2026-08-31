import { createClient } from '@/lib/supabase/server';
import type { ClubEvent } from '@/types/landing';

const CLUB_TZ = 'America/Toronto';

function toDateString(iso: string) {
  // en-CA formats as YYYY-MM-DD, matching what ClubEvent.date/eventSchedule expect
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: CLUB_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(iso));
}

// Intl sometimes separates the time from AM/PM with a narrow no-break
// space (U+202F) instead of a normal one — normalize so it matches the
// plain "h:mm AM/PM" pattern eventSchedule.ts's regex expects.
const NARROW_NBSP = String.fromCharCode(0x202f);

function toTimeString(iso: string) {
  const formatted = new Intl.DateTimeFormat('en-US', {
    timeZone: CLUB_TZ,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(iso));

  return formatted.split(NARROW_NBSP).join(' ');
}

// Real events created in /admin, mapped onto the same ClubEvent shape the
// hardcoded landing-page events use, so they can sit in the same list.
// Events with no date set are skipped — nothing to place on the
// upcoming/past calendar without one.
export async function getDbEvents(): Promise<ClubEvent[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('events')
    .select('id, title, description, location, starts_at')
    .not('starts_at', 'is', null);

  return (data ?? [])
    .filter((row): row is typeof row & { starts_at: string } => row.starts_at !== null)
    .map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description ?? '',
      date: toDateString(row.starts_at),
      time: toTimeString(row.starts_at),
      location: row.location ?? 'TBD',
      images: [],
    }));
}
