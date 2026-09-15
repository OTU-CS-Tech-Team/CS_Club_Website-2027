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

function easeOutExpo(t: number) {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

function easeOutQuart(t: number) {
  return 1 - Math.pow(1 - t, 4);
}

function formatDate(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  return {
    month: new Intl.DateTimeFormat('en-US', { month: 'short' })
      .format(d)
      .toUpperCase(),
    day: new Intl.DateTimeFormat('en-US', { day: 'numeric' }).format(d),
  };
}

export default function UpcomingEvents({ events }: UpcomingEventsProps) {
  const [selected, setSelected] = useState<ClubEvent | null>(null);
  const [progress, setProgress] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const hasEvents = events.length > 0;

  const featured = hasEvents ? events[0] : null;
  const sideEvents = hasEvents ? events.slice(1, 3) : [];
  const interactable = progress >= 0.7;

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    if (reduceMotion) {
      setProgress(1);
      return;
    }

    let raf = 0;
    const update = () => {
      raf = 0;
      const total = section.offsetHeight - window.innerHeight;
      const next =
        total <= 0
          ? 1
          : clamp(-section.getBoundingClientRect().top / total, 0, 1);
      setProgress((prev) => (Math.abs(prev - next) < 0.002 ? prev : next));
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

  const featuredOpacity = easeOutQuart(clamp((progress - 0.05) / 0.28, 0, 1));
  const featuredY = 28 * (1 - featuredOpacity);
  const featuredScale = 0.97 + 0.03 * featuredOpacity;

  const row1Opacity = easeOutExpo(clamp((progress - 0.28) / 0.22, 0, 1));
  const row1X = 40 * (1 - row1Opacity);

  const row2Opacity = easeOutExpo(clamp((progress - 0.42) / 0.22, 0, 1));
  const row2X = 40 * (1 - row2Opacity);

  return (
    <section
      ref={sectionRef}
      className={styles.eventsChapter}
      aria-labelledby="upcoming-heading"
    >
      <div className={styles.eventsFrame}>
        <p className={styles.chapterIndex}>
          <span>02</span>
          <span className={styles.chapterIndexRule} aria-hidden="true" />
          <span>Events</span>
        </p>

        <div className={styles.eventsHeader}>
          <div className={styles.eventsUpNextWrap}>
            <h2 id="upcoming-heading" className={styles.eventsUpNext}>
              Up next
            </h2>
            <span
              className={styles.eventsUpNextUnderline}
              aria-hidden="true"
            />
          </div>

          <Link href="/events" className={styles.eventsViewAll}>
            View all <span aria-hidden="true">→</span>
          </Link>
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
                    transform: `translateY(${featuredY}px) scale(${featuredScale})`,
                    pointerEvents: interactable ? 'auto' : 'none',
                  } as CSSProperties
                }
                onClick={() => setSelected(featured)}
              >
                <div className={styles.eventsFeaturedDateBlock}>
                  <span className={styles.eventsFeaturedMonth}>
                    {formatDate(featured.date).month}
                  </span>
                  <span className={styles.eventsFeaturedDay}>
                    {formatDate(featured.date).day}
                  </span>
                </div>
                <span
                  className={styles.eventsFeaturedDivider}
                  aria-hidden="true"
                />
                <div className={styles.eventsFeaturedContent}>
                  <h3 className={styles.eventsFeaturedTitle}>{featured.title}</h3>
                  <p className={styles.eventsFeaturedLocation}>
                    <svg
                      className={styles.eventsPinIcon}
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
                    {featured.location}
                  </p>
                  {featured.description ? (
                    <p className={styles.eventsFeaturedDesc}>
                      {featured.description}
                    </p>
                  ) : null}
                  <span className={styles.eventsFeaturedRsvp}>
                    RSVP <span aria-hidden="true">→</span>
                  </span>
                </div>
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
                    <div className={styles.eventsSideDateBlock}>
                      <span className={styles.eventsSideMonth}>
                        {formatDate(event.date).month}
                      </span>
                      <span className={styles.eventsSideDay}>
                        {formatDate(event.date).day}
                      </span>
                    </div>
                    <div className={styles.eventsSideContent}>
                      <span className={styles.eventsSideTitle}>{event.title}</span>
                      <span className={styles.eventsSideLocation}>
                        <svg
                          className={styles.eventsPinIcon}
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
                        {event.location}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {selected ? (
        <EventModal event={selected} onClose={() => setSelected(null)} />
      ) : null}
    </section>
  );
}
