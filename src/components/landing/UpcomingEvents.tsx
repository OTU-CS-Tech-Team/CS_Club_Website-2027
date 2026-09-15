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

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function smoothProgress(current: number, target: number, factor: number) {
  return current + (target - current) * factor;
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
  const [scrollProgress, setScrollProgress] = useState(0);
  const [displayProgress, setDisplayProgress] = useState(0);
  const [interactable, setInteractable] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const displayProgressRef = useRef(0);
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
      setScrollProgress(1);
      setDisplayProgress(1);
      setInteractable(true);
      return;
    }

    let raf = 0;
    let animating = false;

    const animate = () => {
      const target = scrollProgress;
      const current = displayProgressRef.current;
      const next = smoothProgress(current, target, 0.08);

      if (Math.abs(next - current) > 0.0005) {
        displayProgressRef.current = next;
        setDisplayProgress(next);
        animating = true;
        raf = window.requestAnimationFrame(animate);
      } else {
        displayProgressRef.current = target;
        setDisplayProgress(target);
        animating = false;
      }
    };

    const update = () => {
      const total = section.offsetHeight - window.innerHeight;
      if (total <= 0) {
        setScrollProgress(1);
        setInteractable(true);
        return;
      }
      const raw = clamp(-section.getBoundingClientRect().top / total, 0, 1);
      setScrollProgress(raw);
      setInteractable(raw >= 0.98);

      if (!animating) {
        animating = true;
        raf = window.requestAnimationFrame(animate);
      }
    };

    const onScroll = () => {
      update();
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [scrollProgress]);

  const p = displayProgress;

  const chapterOpacity = easeOutExpo(clamp(p / 0.15, 0, 1));
  const chapterY = 12 * (1 - easeOutExpo(clamp(p / 0.15, 0, 1)));

  const upNextOpacity = easeOutExpo(clamp((p - 0.12) / 0.2, 0, 1));
  const upNextY = 32 * (1 - easeOutExpo(clamp((p - 0.12) / 0.22, 0, 1)));
  const underlineScale = easeInOutCubic(clamp((p - 0.25) / 0.18, 0, 1));

  const featuredOpacity = easeOutQuart(clamp((p - 0.38) / 0.28, 0, 1));
  const featuredY = 6 * (1 - easeOutQuart(clamp((p - 0.38) / 0.28, 0, 1)));
  const featuredScale = 0.97 + 0.03 * easeOutQuart(clamp((p - 0.38) / 0.28, 0, 1));

  const row1Opacity = easeOutExpo(clamp((p - 0.62) / 0.16, 0, 1));
  const row1X = 48 * (1 - easeOutExpo(clamp((p - 0.62) / 0.18, 0, 1)));

  const row2Opacity = easeOutExpo(clamp((p - 0.72) / 0.16, 0, 1));
  const row2X = 48 * (1 - easeOutExpo(clamp((p - 0.72) / 0.18, 0, 1)));

  const viewAllOpacity = easeOutExpo(clamp((p - 0.88) / 0.12, 0, 1));
  const viewAllY = 8 * (1 - easeOutExpo(clamp((p - 0.88) / 0.12, 0, 1)));

  return (
    <section
      ref={sectionRef}
      className={styles.eventsChapter}
      aria-labelledby="upcoming-heading"
    >
      <div className={styles.eventsFrame}>
        <p
          className={styles.chapterIndex}
          style={
            {
              opacity: chapterOpacity,
              transform: `translateY(${chapterY}px)`,
            } as CSSProperties
          }
        >
          <span>02</span>
          <span className={styles.chapterIndexRule} aria-hidden="true" />
          <span>Events</span>
        </p>

        <div className={styles.eventsHeader}>
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
              style={
                {
                  transform: `scaleX(${underlineScale})`,
                  transformOrigin: 'left center',
                } as CSSProperties
              }
              aria-hidden="true"
            />
          </div>

          <Link
            href="/events"
            className={styles.eventsViewAll}
            style={
              {
                opacity: viewAllOpacity,
                transform: `translateY(${viewAllY}px)`,
                pointerEvents: interactable ? 'auto' : 'none',
              } as CSSProperties
            }
          >
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
                    transform: `translateY(${featuredY}%) scale(${featuredScale})`,
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
                <span className={styles.eventsFeaturedDivider} aria-hidden="true" />
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
                  {featured.description && (
                    <p className={styles.eventsFeaturedDesc}>{featured.description}</p>
                  )}
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
