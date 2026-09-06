'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  getMailingListStatus,
  subscribeGuest,
  subscribeLoggedIn,
} from '@/app/mailing-list/actions';
import type { NewsItem } from '@/types/landing';
import RecapVideo from './RecapVideo';
import styles from './landing.module.css';

type TeamActivityProps = {
  news: NewsItem[];
  recapVideoId: string;
};

function formatPosted(iso: string) {
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(`${iso}T12:00:00`));
}

export default function TeamActivity({ news, recapVideoId }: TeamActivityProps) {
  const supabase = createClient();
  const [authStatus, setAuthStatus] = useState<'loading' | 'signedOut' | 'signedIn'>('loading');
  const [subscribed, setSubscribed] = useState(false);
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

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
          ? "You're already signed up for the mailing list!"
          : "You're on the mailing list.",
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

  return (
    <section className={styles.section} aria-labelledby="activity-heading">
      <div className={styles.sectionHead}>
        <h2 id="activity-heading" className={styles.sectionTitle}>
          From the team
        </h2>
        {authStatus === 'loading' ? null : subscribed ? (
          <p className={styles.mailingNote} style={{ margin: 0 }}>
            You&apos;re on the mailing list
          </p>
        ) : authStatus === 'signedIn' ? (
          <button
            type="button"
            className={`${styles.cta} ${styles.ctaGhost}`}
            onClick={() => void handleLoggedInSignup()}
            disabled={pending}
          >
            {pending ? 'Signing up…' : 'Sign up for our mailing list'}
          </button>
        ) : (
          <button
            type="button"
            className={`${styles.cta} ${styles.ctaGhost}`}
            onClick={() => {
              setShowGuestForm((open) => !open);
              setError('');
              setMessage('');
            }}
          >
            Sign up for our mailing list
          </button>
        )}
      </div>

      {showGuestForm && !subscribed && authStatus === 'signedOut' ? (
        <form className={styles.form} onSubmit={handleGuestSubmit} noValidate style={{ marginTop: '1rem' }}>
          <h3 className={styles.formTitle}>Join the mailing list</h3>
          <div className={styles.field}>
            <label htmlFor="mailing-name">Name</label>
            <input
              id="mailing-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="mailing-email">Email</label>
            <input
              id="mailing-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          {error ? <p className={styles.formError}>{error}</p> : null}
          <div className={styles.formActions}>
            <button type="submit" className={styles.cta} disabled={pending}>
              {pending ? 'Signing up…' : 'Sign up'}
            </button>
          </div>
        </form>
      ) : null}

      {message ? <p className={styles.mailingNote}>{message}</p> : null}
      {error && authStatus === 'signedIn' ? <p className={styles.formError}>{error}</p> : null}

      <div className={styles.activity}>
        <div className={styles.activityCol}>
          <p className={styles.kicker}>News from execs</p>
          <div className={styles.newsList}>
            {news.map((item) => (
              <article key={item.id} className={styles.newsCard}>
                <h3 className={styles.newsTitle}>{item.title}</h3>
                <p className={styles.newsBody}>{item.body}</p>
                <time className={styles.newsDate} dateTime={item.postedOn}>
                  Posted on {formatPosted(item.postedOn)}
                </time>
              </article>
            ))}
          </div>
        </div>
        <div className={styles.activityCol}>
          <p className={styles.kicker}>2025–2026 recap</p>
          <RecapVideo videoId={recapVideoId} />
        </div>
      </div>
    </section>
  );
}
