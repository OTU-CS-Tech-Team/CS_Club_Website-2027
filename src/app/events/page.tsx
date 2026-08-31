import { IBM_Plex_Sans } from 'next/font/google';
import EventsBoard from '@/components/events/EventsBoard';
import { events } from '@/data/landing';
import { getPastEvents, getUpcomingEvents } from '@/lib/eventSchedule';
import { getDbEvents } from '@/lib/dbEvents';
import styles from '@/components/landing/landing.module.css';

const plex = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const metadata = {
  title: 'Events — CS Club',
  description: 'Upcoming and past Computer Science Club events.',
};

export const dynamic = 'force-dynamic';

export default async function EventsPage() {
  const dbEvents = await getDbEvents();
  const allEvents = [...events, ...dbEvents];
  const upcoming = getUpcomingEvents(allEvents);
  const past = getPastEvents(allEvents);

  return (
    <div className={`${styles.landing} ${plex.className}`}>
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
