'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import type { ClubEvent } from '@/types/landing';
import EventModal from './EventModal';
import styles from './landing.module.css';

type UpcomingEventsProps = {
  events: ClubEvent[];
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

function formatSheetDate(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  return {
    month: new Intl.DateTimeFormat('en-US', { month: 'short' })
      .format(d)
      .toUpperCase(),
    day: new Intl.DateTimeFormat('en-US', { day: 'numeric' }).format(d),
  };
}

/** Each sheet starts entering after the previous one is partly in. */
const CARD_START = [0.04, 0.18, 0.32, 0.46] as const;
const CARD_SPAN = 0.22;

const TILTS = [-1.8, 1.5, 1.2, -1.4] as const;

const FLY_FROM = [
  { x: -48, y: 90, rot: -10 },
  { x: 52, y: 110, rot: 12 },
  { x: -40, y: 100, rot: -8 },
  { x: 44, y: 120, rot: 9 },
] as const;

export default function UpcomingEvents({ events }: UpcomingEventsProps) {
  const [selected, setSelected] = useState<ClubEvent | null>(null);
  const [progress, setProgress] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const hasEvents = events.length > 0;

  useEffect(() => {
    if (!hasEvents) {
      setProgress(1);
      return;
    }

    const section = sectionRef.current;
    if (!section) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      setProgress(1);
      return;
    }

    let raf = 0;
    const update = () => {
      raf = 0;
      const total = section.offsetHeight - window.innerHeight;
      if (total <= 0) {
        setProgress(1);
        return;
      }
      const next = clamp(-section.getBoundingClientRect().top / total, 0, 1);
      setProgress((prev) => (Math.abs(prev - next) < 0.001 ? prev : next));
    };

    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [hasEvents]);

  return (
    <section
      ref={sectionRef}
      className={`${styles.eventsChapter} ${hasEvents ? styles.eventsChapterScroll : ''}`}
      aria-labelledby="upcoming-heading"
    >
      <div className={styles.eventsFrame}>
        <p className={styles.chapterIndex}>
          <span>02</span>
          <span className={styles.chapterIndexRule} aria-hidden="true" />
          <span>Events</span>
        </p>
        <div className={styles.sectionHead}>
          <h2 id="upcoming-heading" className={styles.sectionTitle}>
            Upcoming events
          </h2>
          <Link href="/events" className={styles.textLink}>
            View all events
          </Link>
        </div>

        {!hasEvents ? (
          <div className={styles.calEmptyWrap}>
            <div className={`${styles.calSheet} ${styles.calEmptyNote}`} role="status">
              <span className={styles.calBind} aria-hidden="true">
                <span />
                <span />
                <span />
                <span />
              </span>
              <p className={styles.calEmptyTitle}>Currently no upcoming events!</p>
              <p className={styles.calEmptyBody}>
                Come back later for whatever&apos;s next.
              </p>
            </div>
          </div>
        ) : (
          <div className={styles.calGrid}>
            {events.map((event, index) => {
              const { month, day } = formatSheetDate(event.date);
              const start = CARD_START[Math.min(index, CARD_START.length - 1)];
              const local = easeOutCubic(clamp((progress - start) / CARD_SPAN, 0, 1));
              const from = FLY_FROM[Math.min(index, FLY_FROM.length - 1)];
              const tilt = TILTS[Math.min(index, TILTS.length - 1)];
              const style = {
                '--card-opacity': String(local),
                '--card-x': `${from.x * (1 - local)}px`,
                '--card-y': `${from.y * (1 - local)}px`,
                '--card-rot': `${from.rot * (1 - local)}deg`,
                '--sheet-tilt': `${tilt}deg`,
              } as CSSProperties;

              return (
                <div key={event.id} className={styles.calSlot} style={style}>
                  <button
                    type="button"
                    className={styles.calSheet}
                    onClick={() => setSelected(event)}
                  >
                    <span className={styles.calBind} aria-hidden="true">
                      <span />
                      <span />
                      <span />
                      <span />
                    </span>
                    <span className={styles.calMonth}>{month}</span>
                    <span className={styles.calDay}>{day}</span>
                    <span className={styles.calTitle}>{event.title}</span>
                    <span className={styles.calMeta}>
                      {event.time} · {event.location}
                    </span>
                    <span className={styles.calRule} aria-hidden="true" />
                    <span className={styles.calBody}>{event.description}</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selected ? <EventModal event={selected} onClose={() => setSelected(null)} /> : null}
    </section>
  );
}
