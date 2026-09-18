import EventsBoard from '@/components/events/EventsBoard';
import { getPublishedEvents } from '@/lib/content';
import { getPastEvents, getUpcomingEvents } from '@/lib/eventSchedule';
import styles from '@/components/events/events.module.css';

export const metadata = {
  title: 'Events — CS Club',
  description: 'Upcoming and past Computer Science Club events.',
};

export const dynamic = 'force-dynamic';

export default async function EventsPage() {
  // Real RSVP only works for DB events (uuid ids). Hardcoded samples in
  // data/landing.ts use the local "Sign up sheet" stub — don't mix them in.
  const dbEvents = await getPublishedEvents();
  const upcoming = getUpcomingEvents(dbEvents);
  const past = getPastEvents(dbEvents);

  return (
    <div className={styles.landing}>
      <div className={styles.shell}>
        <header className={styles.pageHeader}>
          <p className={styles.kicker}>CS Club</p>
          <h1 className={styles.headline}>Events</h1>
        </header>
        <EventsBoard upcoming={upcoming} past={past} />
      </div>
    </div>
  );
}
