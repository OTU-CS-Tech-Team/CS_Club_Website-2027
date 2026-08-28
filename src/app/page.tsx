import { Caveat, IBM_Plex_Sans } from 'next/font/google';
import Hero from '@/components/landing/Hero';
import HackHiveExhibition from '@/components/landing/HackHiveExhibition';
import TeamActivity from '@/components/landing/TeamActivity';
import UpcomingEvents from '@/components/landing/UpcomingEvents';
import { getFeaturedProjects } from '@/data/hackhive';
import { events, getUpcomingEvents, news, recapYoutubeId } from '@/data/landing';
import styles from '@/components/landing/landing.module.css';

const plex = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const caveat = Caveat({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  display: 'swap',
});

export default function HomePage() {
  const upcoming = getUpcomingEvents(events, 3);
  const projects = getFeaturedProjects();

  return (
    <div className={`${styles.landing} ${plex.className}`}>
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
