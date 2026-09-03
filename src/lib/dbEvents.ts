// Shared Toronto-time formatting for events — used by the RSVP
// confirmation/reminder emails. The listing pages themselves now fetch
// real events via lib/content.ts's getPublishedEvents() instead of this
// file's old getDbEvents(), which is why this file is just formatters now.
const CLUB_TZ = 'America/Toronto';

export function toDateString(iso: string) {
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

export function toTimeString(iso: string) {
  const formatted = new Intl.DateTimeFormat('en-US', {
    timeZone: CLUB_TZ,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(iso));

  return formatted.split(NARROW_NBSP).join(' ');
}
