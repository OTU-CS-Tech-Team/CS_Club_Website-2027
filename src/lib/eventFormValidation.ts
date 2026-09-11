export type EventFormValues = {
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  points: string;
  images: string;
};

export function parseEventImageUrls(value: string) {
  return value
    .split(/[\n,]/)
    .map((url) => url.trim())
    .filter(Boolean);
}

export function isValidCalendarDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function validTime(value: string) {
  return /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function validImageUrl(value: string) {
  if (value.startsWith('/') && !value.startsWith('//')) return true;
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

export function validateEventForm(values: EventFormValues) {
  if (!values.title) return 'Enter an event title.';
  if (values.title.length > 160) return 'Event title must be 160 characters or fewer.';
  if (!values.description) return 'Enter an event description.';
  if (values.description.length > 5000) return 'Event description must be 5,000 characters or fewer.';
  if (!values.date) return 'Choose an event date.';
  if (!isValidCalendarDate(values.date)) return 'Choose a valid event date.';
  if (!values.startTime) return 'Choose a start time.';
  if (!validTime(values.startTime)) return 'Choose a valid start time.';
  if (!values.endTime) return 'Choose an end time.';
  if (!validTime(values.endTime)) return 'Choose a valid end time.';
  if (values.endTime <= values.startTime) return 'End time must be after start time.';
  if (!values.location) return 'Enter an event location.';
  if (values.location.length > 200) return 'Event location must be 200 characters or fewer.';
  if (!values.points) return 'Enter the passport points.';

  const points = Number(values.points);
  if (!Number.isInteger(points)) return 'Passport points must be a whole number.';
  if (points < 0 || points > 1000) return 'Passport points must be between 0 and 1,000.';

  const images = parseEventImageUrls(values.images);
  if (images.length > 6) return 'Add no more than six image URLs.';
  const invalidImageIndex = images.findIndex((url) => !validImageUrl(url));
  if (invalidImageIndex >= 0) {
    return `Image URL ${invalidImageIndex + 1} must use HTTPS or begin with a single slash.`;
  }

  return null;
}
