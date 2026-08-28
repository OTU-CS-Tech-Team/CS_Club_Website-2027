'use client';

import { useState } from 'react';
import type { ClubEvent } from '@/types/landing';
import EventCard from '@/components/landing/EventCard';
import EventModal from '@/components/landing/EventModal';
import styles from '@/components/landing/landing.module.css';

type EventsBoardProps = {
  upcoming: ClubEvent[];
  past: ClubEvent[];
};

export default function EventsBoard({ upcoming, past }: EventsBoardProps) {
  const [selected, setSelected] = useState<ClubEvent | null>(null);

  return (
    <>
      <section className={styles.section} aria-labelledby="all-upcoming-heading">
        <div className={styles.sectionHead}>
          <h2 id="all-upcoming-heading" className={styles.sectionTitle}>
            Upcoming events
          </h2>
        </div>
        {upcoming.length > 0 ? (
          <div className={styles.eventGridFill}>
            {upcoming.map((event) => (
              <EventCard key={event.id} event={event} onSelect={setSelected} />
            ))}
          </div>
        ) : (
          <p className={styles.emptyCopy}>Nothing on the calendar yet. Check back soon.</p>
        )}
      </section>

      <section className={styles.section} aria-labelledby="past-events-heading">
        <div className={styles.sectionHead}>
          <h2 id="past-events-heading" className={styles.sectionTitle}>
            Past events
          </h2>
        </div>
        {past.length > 0 ? (
          <div className={styles.eventGridFill}>
            {past.map((event) => (
              <EventCard key={event.id} event={event} onSelect={setSelected} />
            ))}
          </div>
        ) : (
          <p className={styles.emptyCopy}>Past workshops and socials will show up here.</p>
        )}
      </section>

      {selected ? <EventModal event={selected} onClose={() => setSelected(null)} /> : null}
    </>
  );
}
