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

function formatDate(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  return {
    month: new Intl.DateTimeFormat('en-US', { month: 'short' })
      .format(d)
      .toUpperCase(),
    day: new Intl.DateTimeFormat('en-US', { day: 'numeric' }).format(d),
    weekday: new Intl.DateTimeFormat('en-US', { weekday: 'short' })
      .format(d)
      .toUpperCase(),
  };
}

export default function UpcomingEvents({ events }: UpcomingEventsProps) {
  const [selected, setSelected] = useState<ClubEvent | null>(null);
  const [progress, setProgress] = useState(0);
  const [interactable, setInteractable] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const hasEvents = events.length > 0;

  const featured = hasEvents ? events[0] : null;
  const sideEvents = hasEvents ? events.slice(1, 3) : [];

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    if (reduceMotion) {
      setProgress(1);
      setInteractable(true);
      return;
    }

    let raf = 0;
    const update = () => {
      raf = 0;
      const total = section.offsetHeight - window.innerHeight;
      if (total <= 0) {
        setProgress(1);
        setInteractable(true);
        return;
      }
      const next = clamp(-section.getBoundingClientRect().top / total, 0, 1);
      setProgress((prev) => (Math.abs(prev - next) < 0.001 ? prev : next));
      setInteractable(next >= 1);
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
  }, []);

  const chapterOpacity = easeOutCubic(clamp(progress / 0.2, 0, 1));
  const upNextOpacity = easeOutCubic(clamp((progress - 0.2) / 0.25, 0, 1));
  const upNextY = 24 * (1 - easeOutCubic(clamp((progress - 0.2) / 0.25, 0, 1)));
  const underlineWidth = easeOutCubic(clamp((progress - 0.3) / 0.15, 0, 1)) * 100;

  const featuredOpacity = easeOutCubic(clamp((progress - 0.45) / 0.25, 0, 1));
  const featuredY = 8 * (1 - easeOutCubic(clamp((progress - 0.45) / 0.25, 0, 1)));

  const row1Opacity = easeOutCubic(clamp((progress - 0.7) / 0.1, 0, 1));
  const row1X = 40 * (1 - easeOutCubic(clamp((progress - 0.7) / 0.1, 0, 1)));
  const row2Opacity = easeOutCubic(clamp((progress - 0.78) / 0.1, 0, 1));
  const row2X = 40 * (1 - easeOutCubic(clamp((progress - 0.78) / 0.1, 0, 1)));

  const viewAllOpacity = easeOutCubic(clamp((progress - 0.9) / 0.1, 0, 1));

  return (
    <section
      ref={sectionRef}
      className={styles.eventsChapter}
      aria-labelledby="upcoming-heading"
    >
      <div className={styles.eventsFrame}>
        <p
          className={styles.chapterIndex}
          style={{ opacity: chapterOpacity } as CSSProperties}
        >
          <span>02</span>
          <span className={styles.chapterIndexRule} aria-hidden="true" />
          <span>Events</span>
        </p>

        <div
          className={styles.eventsUpNextWrap}
          style={
            {
              opacity: upNextOpacity,
              transform: `translateY(${upNextY}px)`,
            } as CSSProperties
          }
        >
          <h2 id="upcoming-heading" className={styles.eventsUpNext}>
            Up next
          </h2>
          <span
            className={styles.eventsUpNextUnderline}
            style={{ width: `${underlineWidth}%` } as CSSProperties}
            aria-hidden="true"
          />
        </div>

        {!hasEvents ? (
          <div className={styles.eventsEmptyBody}>
            <div className={styles.eventsEmptyCard}>
              <p className={styles.eventsEmptyTitle}>
                Nothing on the calendar right now
              </p>
              <p className={styles.eventsEmptyText}>
                Join our Discord to get pinged when something drops.
              </p>
              <a
                href="https://discord.com/invite/J9AyT8XADz"
                target="_blank"
                rel="noreferrer noopener"
                className={styles.eventsEmptyCta}
              >
                Join Discord
              </a>
            </div>
          </div>
        ) : (
          <div className={styles.eventsBody}>
            {featured && (
              <button
                type="button"
                className={styles.eventsFeatured}
                style={
                  {
                    opacity: featuredOpacity,
                    transform: `translateY(${featuredY}%)`,
                    pointerEvents: interactable ? 'auto' : 'none',
                  } as CSSProperties
                }
                onClick={() => setSelected(featured)}
              >
                <div className={styles.eventsFeaturedDate}>
                  <span className={styles.eventsFeaturedMonth}>
                    {formatDate(featured.date).month}
                  </span>
                  <span className={styles.eventsFeaturedDay}>
                    {formatDate(featured.date).day}
                  </span>
                </div>
                <h3 className={styles.eventsFeaturedTitle}>{featured.title}</h3>
                <p className={styles.eventsFeaturedLocation}>
                  {featured.time} · {featured.location}
                </p>
                <span className={styles.eventsFeaturedRsvp}>RSVP</span>
              </button>
            )}

            <div className={styles.eventsSideCol}>
              {sideEvents.map((event, idx) => {
                const rowOpacity = idx === 0 ? row1Opacity : row2Opacity;
                const rowX = idx === 0 ? row1X : row2X;
                return (
                  <button
                    key={event.id}
                    type="button"
                    className={styles.eventsSideRow}
                    style={
                      {
                        opacity: rowOpacity,
                        transform: `translateX(${rowX}px)`,
                        pointerEvents: interactable ? 'auto' : 'none',
                      } as CSSProperties
                    }
                    onClick={() => setSelected(event)}
                  >
                    <span className={styles.eventsSideDateChip}>
                      {formatDate(event.date).month} {formatDate(event.date).day}
                    </span>
                    <span className={styles.eventsSideTitle}>{event.title}</span>
                    <span className={styles.eventsSideLocation}>
                      {event.location}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div
          className={styles.eventsFooter}
          style={
            {
              opacity: viewAllOpacity,
              pointerEvents: interactable ? 'auto' : 'none',
            } as CSSProperties
          }
        >
          <Link href="/events" className={styles.eventsViewAll}>
            View all events <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>

      {selected ? (
        <EventModal event={selected} onClose={() => setSelected(null)} />
      ) : null}
    </section>
  );
}
