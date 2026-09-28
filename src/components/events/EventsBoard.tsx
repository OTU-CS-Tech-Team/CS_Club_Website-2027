'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { ClubEvent } from '@/types/landing';
import EventCard from '@/components/landing/EventCard';
import EventModal from '@/components/landing/EventModal';
import landing from '@/components/landing/landing.module.css';
import styles from '@/components/events/events.module.css';

type EventsBoardProps = {
  upcoming: ClubEvent[];
  past: ClubEvent[];
};

function formatDate(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  return {
    month: new Intl.DateTimeFormat('en-US', { month: 'short' })
      .format(d)
      .toUpperCase(),
    day: new Intl.DateTimeFormat('en-US', { day: 'numeric' }).format(d),
  };
}

function PinIcon() {
  return (
    <svg
      className={landing.eventsPinIcon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

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
      <section className={styles.section} aria-labelledby="all-upcoming-heading">
        <Link href="/" className={styles.backLink}>
          Back to homepage
        </Link>
        {nextEvent ? (
          <div className={styles.upcomingBoard}>
            <p className={`${styles.sectionTitle} ${styles.nextLabel}`}>Next event</p>
            <h2
              id="all-upcoming-heading"
              className={`${styles.sectionTitle} ${styles.upcomingLabel}`}
            >
              Upcoming events
            </h2>
            <button
              type="button"
              className={landing.eventsFeatured}
              onClick={() => setSelected(nextEvent)}
            >
              <div className={landing.eventsFeaturedDateBlock}>
                <span className={landing.eventsFeaturedMonth}>
                  {formatDate(nextEvent.date).month}
                </span>
                <span className={landing.eventsFeaturedDay}>
                  {formatDate(nextEvent.date).day}
                </span>
              </div>
              <span className={landing.eventsFeaturedDivider} aria-hidden="true" />
              <div className={landing.eventsFeaturedContent}>
                <h3 className={landing.eventsFeaturedTitle}>{nextEvent.title}</h3>
                <p className={landing.eventsFeaturedLocation}>
                  <PinIcon />
                  {nextEvent.location}
                </p>
                {nextEvent.description ? (
                  <p className={landing.eventsFeaturedDesc}>{nextEvent.description}</p>
                ) : null}
                <span className={landing.eventsFeaturedRsvp}>
                  RSVP <span aria-hidden="true">›</span>
                </span>
              </div>
            </button>

            <div className={styles.upcomingSideCol}>
              {laterEvents.length > 0 ? (
                laterEvents.map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    className={landing.eventsSideRow}
                    onClick={() => setSelected(event)}
                  >
                    <div className={landing.eventsSideDateBlock}>
                      <span className={landing.eventsSideMonth}>
                        {formatDate(event.date).month}
                      </span>
                      <span className={landing.eventsSideDay}>
                        {formatDate(event.date).day}
                      </span>
                    </div>
                    <div className={landing.eventsSideContent}>
                      <span className={landing.eventsSideTitle}>{event.title}</span>
                      <span className={landing.eventsSideLocation}>
                        <PinIcon />
                        {event.location}
                      </span>
                    </div>
                  </button>
                ))
              ) : (
                <p className={styles.emptyCopy}>
                  Nothing else scheduled after this one yet. Check back soon.
                </p>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className={styles.sectionHead}>
              <h2 id="all-upcoming-heading" className={styles.sectionTitle}>
                Upcoming events
              </h2>
            </div>
            <p className={styles.emptyCopy}>Nothing on the calendar yet. Check back soon.</p>
          </>
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
