'use client';

import { useEffect, useId, useRef, useState, type CSSProperties, type FormEvent } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
  getMailingListStatus,
  subscribeGuest,
  subscribeLoggedIn,
} from '@/app/mailing-list/actions';
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

function PinIcon() {
  return (
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
  );
}

export default function UpcomingEvents({ events }: UpcomingEventsProps) {
  const [selected, setSelected] = useState<ClubEvent | null>(null);
  const [progress, setProgress] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const formId = useId();
  const supabase = createClient();

  const [authStatus, setAuthStatus] = useState<'loading' | 'signedOut' | 'signedIn'>('loading');
  const [subscribed, setSubscribed] = useState(false);
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const hasEvents = events.length > 0;
  const featured = hasEvents ? events[0] : null;
  const sideEvents = hasEvents ? events.slice(1, 5) : [];
  const interactable = progress >= 0.55;
  const holdTriggeredRef = useRef(false);
  const holdUntilRef = useRef(0);
  const holdScrollYRef = useRef(0);

  // Last side card: start 0.18 + idx*0.1, duration 0.18 → done at that sum.
  const lastFlyInDone =
    sideEvents.length > 0
      ? 0.18 + (sideEvents.length - 1) * 0.1 + 0.18
      : 0.28;

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

      if (
        !holdTriggeredRef.current &&
        next >= lastFlyInDone &&
        next < 0.98
      ) {
        holdTriggeredRef.current = true;
        holdScrollYRef.current = window.scrollY;
        holdUntilRef.current = performance.now() + 1000;
      }
    };

    const onScroll = () => {
      if (performance.now() < holdUntilRef.current) {
        if (Math.abs(window.scrollY - holdScrollYRef.current) > 0.5) {
          window.scrollTo(0, holdScrollYRef.current);
        }
        return;
      }
      if (raf) return;
      raf = window.requestAnimationFrame(update);
    };

    const freezeScroll = (event: Event) => {
      if (performance.now() >= holdUntilRef.current) return;
      event.preventDefault();
      if (Math.abs(window.scrollY - holdScrollYRef.current) > 0.5) {
        window.scrollTo(0, holdScrollYRef.current);
      }
    };

    const freezeKeys = (event: KeyboardEvent) => {
      if (performance.now() >= holdUntilRef.current) return;
      const keys = [
        'ArrowDown',
        'ArrowUp',
        'PageDown',
        'PageUp',
        ' ',
        'Spacebar',
        'Home',
        'End',
      ];
      if (!keys.includes(event.key)) return;
      event.preventDefault();
      if (Math.abs(window.scrollY - holdScrollYRef.current) > 0.5) {
        window.scrollTo(0, holdScrollYRef.current);
      }
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    window.addEventListener('wheel', freezeScroll, { passive: false });
    window.addEventListener('touchmove', freezeScroll, { passive: false });
    window.addEventListener('keydown', freezeKeys);
    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      window.removeEventListener('wheel', freezeScroll);
      window.removeEventListener('touchmove', freezeScroll);
      window.removeEventListener('keydown', freezeKeys);
    };
  }, [lastFlyInDone]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const status = await getMailingListStatus();
        if (cancelled) return;
        setAuthStatus(status.signedIn ? 'signedIn' : 'signedOut');
        setSubscribed(status.subscribed);
      } catch {
        if (cancelled) return;
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setAuthStatus(session?.user ? 'signedIn' : 'signedOut');
      }
    }

    load();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void load();
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [supabase]);

  async function handleLoggedInSignup() {
    setError('');
    setMessage('');
    setPending(true);
    try {
      const result = await subscribeLoggedIn();
      setSubscribed(true);
      setMessage(
        result.alreadySubscribed
          ? "You're already signed up for email alerts!"
          : "You're signed up for email alerts.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not join the mailing list.');
    }
    setPending(false);
  }

  async function handleGuestSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');
    setPending(true);
    try {
      await subscribeGuest(name, email);
      setShowGuestForm(false);
      setMessage('Check your email to confirm — you are not on the list until you confirm.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not join the mailing list.');
    }
    setPending(false);
  }

  const featuredOpacity = easeOutQuart(clamp((progress - 0.04) / 0.24, 0, 1));
  const featuredY = 22 * (1 - featuredOpacity);
  const featuredScale = 0.98 + 0.02 * featuredOpacity;

  const alertOpacity = easeOutExpo(clamp((progress - 0.22) / 0.18, 0, 1));

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
              Upcoming events
            </h2>
            <span className={styles.eventsUpNextUnderline} aria-hidden="true" />
          </div>

          <Link href="/events" className={styles.eventsViewAll}>
            View all events <span aria-hidden="true">→</span>
          </Link>
        </div>

        {!hasEvents ? (
          <div className={styles.eventsEmptyBody}>
            <div className={styles.eventsEmptyCard}>
              <p className={styles.eventsEmptyTitle}>
                Nothing on the calendar right now
              </p>
              <p className={styles.eventsEmptyText}>
                Join our Discord to get pinged when something drops — or sign up
                for email alerts below.
              </p>
              <div className={styles.eventsAlertBlock}>
                {authStatus === 'loading' ? null : subscribed ? (
                  <p className={styles.mailingNote} style={{ margin: 0 }}>
                    You&apos;re signed up for email alerts
                  </p>
                ) : authStatus === 'signedIn' ? (
                  <button
                    type="button"
                    className={styles.eventsAlertBtn}
                    onClick={() => void handleLoggedInSignup()}
                    disabled={pending}
                  >
                    {pending ? 'Signing up…' : 'Sign up for email alerts'}
                    {!pending ? <span aria-hidden="true">›</span> : null}
                  </button>
                ) : (
                  <button
                    type="button"
                    className={styles.eventsAlertBtn}
                    onClick={() => {
                      setShowGuestForm((open) => !open);
                      setError('');
                      setMessage('');
                    }}
                  >
                    Sign up for email alerts
                  </button>
                )}
              </div>
              {showGuestForm && !subscribed && authStatus === 'signedOut' ? (
                <form
                  className={styles.eventsAlertForm}
                  onSubmit={handleGuestSubmit}
                  noValidate
                >
                  <div className={styles.field}>
                    <label htmlFor={`${formId}-empty-name`}>Name</label>
                    <input
                      id={`${formId}-empty-name`}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor={`${formId}-empty-email`}>Email</label>
                    <input
                      id={`${formId}-empty-email`}
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  {error ? <p className={styles.formError}>{error}</p> : null}
                  <button type="submit" className={styles.cta} disabled={pending}>
                    {pending ? 'Signing up…' : 'Sign up'}
                  </button>
                </form>
              ) : null}
              {message ? <p className={styles.mailingNote}>{message}</p> : null}
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
          <div className={styles.eventsStack}>
            <div className={styles.eventsPair}>
              {featured ? (
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
                      <PinIcon />
                      {featured.location}
                    </p>
                    {featured.description ? (
                      <p className={styles.eventsFeaturedDesc}>
                        {featured.description}
                      </p>
                    ) : null}
                    <span className={styles.eventsFeaturedRsvp}>
                      RSVP <span aria-hidden="true">›</span>
                    </span>
                  </div>
                </button>
              ) : null}

              <div className={styles.eventsSideCol}>
                {sideEvents.map((event, idx) => {
                  const start = 0.18 + idx * 0.1;
                  const rowOpacity = easeOutExpo(
                    clamp((progress - start) / 0.18, 0, 1),
                  );
                  const rowX = 36 * (1 - rowOpacity);
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
                          <PinIcon />
                          {event.location}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div
              className={styles.eventsAlertBlock}
              style={{ opacity: alertOpacity } as CSSProperties}
            >
              {authStatus === 'loading' ? null : subscribed ? (
                <p className={styles.mailingNote} style={{ margin: 0 }}>
                  You&apos;re signed up for email alerts
                </p>
              ) : authStatus === 'signedIn' ? (
                <button
                  type="button"
                  className={styles.eventsAlertBtn}
                  onClick={() => void handleLoggedInSignup()}
                  disabled={pending}
                >
                  {pending ? 'Signing up…' : 'Sign up for email alerts'}
                  {!pending ? <span aria-hidden="true">›</span> : null}
                </button>
              ) : (
                <button
                  type="button"
                  className={styles.eventsAlertBtn}
                  onClick={() => {
                    setShowGuestForm((open) => !open);
                    setError('');
                    setMessage('');
                  }}
                >
                  Sign up for email alerts
                  <span aria-hidden="true">›</span>
                </button>
              )}

              {showGuestForm && !subscribed && authStatus === 'signedOut' ? (
                <form
                  className={styles.eventsAlertForm}
                  onSubmit={handleGuestSubmit}
                  noValidate
                >
                  <div className={styles.field}>
                    <label htmlFor={`${formId}-name`}>Name</label>
                    <input
                      id={`${formId}-name`}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor={`${formId}-email`}>Email</label>
                    <input
                      id={`${formId}-email`}
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  {error ? <p className={styles.formError}>{error}</p> : null}
                  <button type="submit" className={styles.cta} disabled={pending}>
                    {pending ? 'Signing up…' : 'Sign up'}
                  </button>
                </form>
              ) : null}

              {message ? <p className={styles.mailingNote}>{message}</p> : null}
              {error && authStatus === 'signedIn' ? (
                <p className={styles.formError}>{error}</p>
              ) : null}
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
