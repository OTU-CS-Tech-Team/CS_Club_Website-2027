import type { ClubEvent } from '@/types/landing';

const CLUB_TZ = 'America/Toronto';

function parseClock(raw: string): { hours: number; minutes: number } | null {
  const match = raw.trim().match(/^(\d{1,2}):(\d{2})\s*([AaPp][Mm])$/);
  if (!match) {
    return null;
  }

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridian = match[3].toUpperCase();

  if (meridian === 'PM' && hours !== 12) {
    hours += 12;
  }
  if (meridian === 'AM' && hours === 12) {
    hours = 0;
  }

  return { hours, minutes };
}

function endClock(timeRange: string): { hours: number; minutes: number } {
  const parts = timeRange.split(/\s*[–—-]\s*/);
  return (
    parseClock(parts[parts.length - 1] ?? '') ??
    parseClock(parts[0] ?? '') ?? { hours: 23, minutes: 59 }
  );
}

function timeZoneOffsetMs(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(instant);

  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);

  const asUtc = Date.UTC(
    value('year'),
    value('month') - 1,
    value('day'),
    value('hour'),
    value('minute'),
    value('second'),
  );

  return asUtc - instant.getTime();
}

function torontoWallTime(isoDate: string, hours: number, minutes: number): Date {
  const [year, month, day] = isoDate.split('-').map(Number);
  const utcGuess = Date.UTC(year, month - 1, day, hours, minutes, 0);
  const first = utcGuess - timeZoneOffsetMs(new Date(utcGuess), CLUB_TZ);
  return new Date(utcGuess - timeZoneOffsetMs(new Date(first), CLUB_TZ));
}

export function getEventEnd(event: ClubEvent): Date {
  const clock = endClock(event.time);
  return torontoWallTime(event.date, clock.hours, clock.minutes);
}

export function isEventUpcoming(event: ClubEvent, now = new Date()): boolean {
  return getEventEnd(event).getTime() > now.getTime();
}

function byDateThenTitle(a: ClubEvent, b: ClubEvent) {
  const byDate = a.date.localeCompare(b.date);
  return byDate !== 0 ? byDate : a.title.localeCompare(b.title);
}

export function getUpcomingEvents(all: ClubEvent[], max?: number): ClubEvent[] {
  const upcoming = all.filter((event) => isEventUpcoming(event)).sort(byDateThenTitle);
  return max == null ? upcoming : upcoming.slice(0, max);
}

export function getPastEvents(all: ClubEvent[]): ClubEvent[] {
  return all
    .filter((event) => !isEventUpcoming(event))
    .sort((a, b) => byDateThenTitle(b, a));
}
