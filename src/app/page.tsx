import { Caveat } from 'next/font/google';
import Hero from '@/components/landing/Hero';
import HackHiveExhibition from '@/components/landing/HackHiveExhibition';
import TeamActivity from '@/components/landing/TeamActivity';
import UpcomingEvents from '@/components/landing/UpcomingEvents';
import { getFeaturedProjects } from '@/data/hackhive';
import { events, getUpcomingEvents, news, recapYoutubeId } from '@/data/landing';
import { getPublishedEvents } from '@/lib/content';
import styles from '@/components/landing/landing.module.css';

const caveat = Caveat({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  display: 'swap',
});

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const dbEvents = await getPublishedEvents();
  // Prefer published DB events so the modal gets one-click RSVP; fall back
  // to sample cards only when the calendar is empty.
  const upcoming = getUpcomingEvents(dbEvents.length ? dbEvents : events, 3);
  const projects = getFeaturedProjects();

  return (
    <div className={styles.landing}>
      <div className={styles.shell}>
        <Hero />
        <UpcomingEvents events={upcoming} />
        <TeamActivity news={news} recapVideoId={recapYoutubeId} />
        <HackHiveExhibition
          projects={projects}
          handwrittenClass={caveat.className}
        />
      </div>
    </div>
  );
}
