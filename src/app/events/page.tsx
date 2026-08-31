import { createClient } from '@/lib/supabase/server';
import RsvpButton from './RsvpButton';

export default async function EventsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: events } = await supabase
    .from('events')
    .select('id, title, description, location, starts_at, points')
    .order('starts_at', { ascending: true });

  let myRsvps = new Set<string>();
  if (user) {
    const { data: rsvps } = await supabase
      .from('event_rsvps')
      .select('event_id')
      .eq('user_id', user.id);
    myRsvps = new Set((rsvps ?? []).map((r) => r.event_id));
  }

  return (
    <div className="page">
      <h1>Upcoming Events</h1>

      {events && events.length > 0 ? (
        <ul className="event-list">
          {events.map((event) => (
            <li key={event.id}>
              <h3>{event.title}</h3>
              {event.starts_at && <p>{new Date(event.starts_at).toLocaleString()}</p>}
              {event.location && <p>{event.location}</p>}
              {event.description && <p>{event.description}</p>}
              <p>{event.points} points</p>
              {user ? (
                <RsvpButton eventId={event.id} initialRsvped={myRsvps.has(event.id)} />
              ) : (
                <p>
                  <a href="/login">Log in</a> to RSVP.
                </p>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p>No events yet — check back soon.</p>
      )}
    </div>
  );
}
