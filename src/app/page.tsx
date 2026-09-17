import Hero from '@/components/landing/Hero';
import HackHiveArchivePostcard from '@/components/landing/HackHiveArchivePostcard';
import HackHiveSneakPeek from '@/components/landing/HackHiveSneakPeek';
import LandingScrollReset from '@/components/landing/LandingScrollReset';
import UpcomingEvents from '@/components/landing/UpcomingEvents';
import { getFeaturedProjects } from '@/data/hackhive';
import { events, getUpcomingEvents } from '@/data/landing';
import { getPublishedEvents } from '@/lib/content';
import styles from '@/components/landing/landing.module.css';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const dbEvents = await getPublishedEvents();
  // Prefer published DB events so the modal gets one-click RSVP; fall back
  // to sample cards only when the calendar is empty.
  const upcoming = getUpcomingEvents(dbEvents.length ? dbEvents : events, 5);
  const projects = getFeaturedProjects();

  return (
    <div className={styles.landing}>
      <LandingScrollReset />
      <Hero />
      <UpcomingEvents events={upcoming} />
      <HackHiveSneakPeek />
      <HackHiveArchivePostcard projects={projects} />
    </div>
  );
}
