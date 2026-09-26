'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { ClubEvent } from '@/types/landing';
import EventCard from '@/components/landing/EventCard';
import EventModal from '@/components/landing/EventModal';
import styles from '@/components/events/events.module.css';

type EventsBoardProps = {
  upcoming: ClubEvent[];
  past: ClubEvent[];
};

export default function EventsBoard({ upcoming, past }: EventsBoardProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<ClubEvent | null>(null);
  // `upcoming` arrives sorted soonest-first, so the head is the closest event.
  const [nextEvent, ...laterEvents] = upcoming;

  useEffect(() => {
    router.refresh();
  }, [router]);

  return (
    <>
      {nextEvent ? (
        <section className={styles.section} aria-labelledby="next-event-heading">
          <Link href="/" className={styles.backLink}>
            Back to homepage
          </Link>
          <div className={styles.sectionHead}>
            <h2 id="next-event-heading" className={styles.sectionTitle}>
              Next up
            </h2>
          </div>
          <div className={styles.nextEventSlot}>
            <EventCard event={nextEvent} featured onSelect={setSelected} />
          </div>
        </section>
      ) : null}

      <section className={styles.section} aria-labelledby="all-upcoming-heading">
        {nextEvent ? null : (
          <Link href="/" className={styles.backLink}>
            Back to homepage
          </Link>
        )}
        <div className={styles.sectionHead}>
          <h2 id="all-upcoming-heading" className={styles.sectionTitle}>
            Upcoming events
          </h2>
        </div>
        {laterEvents.length > 0 ? (
          <div className={styles.eventGridFill}>
            {laterEvents.map((event) => (
              <EventCard key={event.id} event={event} onSelect={setSelected} />
            ))}
          </div>
        ) : (
          <p className={styles.emptyCopy}>
            {nextEvent
              ? 'Nothing else scheduled after this one yet. Check back soon.'
              : 'Nothing on the calendar yet. Check back soon.'}
          </p>
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

      {selected ? (
        <EventModal event={selected} onClose={() => setSelected(null)} />
      ) : null}
    </>
  );
}
