'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { ClubEvent } from '@/types/landing';
import EventCard from './EventCard';
import EventModal from './EventModal';
import styles from './landing.module.css';

type UpcomingEventsProps = {
  events: ClubEvent[];
};

export default function UpcomingEvents({ events }: UpcomingEventsProps) {
  const [selected, setSelected] = useState<ClubEvent | null>(null);

  return (
    <section className={styles.section} aria-labelledby="upcoming-heading">
      <div className={styles.sectionHead}>
        <h2 id="upcoming-heading" className={styles.sectionTitle}>
          Upcoming events
        </h2>
        <Link href="/events" className={styles.textLink}>
          View all events
        </Link>
      </div>
      {events.length === 0 ? (
        <p className={styles.emptyCopy}>Stay tuned for upcoming events!</p>
      ) : (
        <div className={styles.eventGrid}>
          {events.map((event, index) => (
            <EventCard
              key={event.id}
              event={event}
              featured={index === 0}
              onSelect={setSelected}
            />
          ))}
        </div>
      )}
      {selected ? <EventModal event={selected} onClose={() => setSelected(null)} /> : null}
    </section>
  );
}
