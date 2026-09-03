'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toggleRsvp, registerGuest } from '@/app/events/actions';
import { YEARS } from './EventSignupForm';
import styles from './landing.module.css';

// RSVP control for a real, DB-backed event. Signed-in members RSVP
// normally (event_rsvps). Signed-out visitors register as a guest instead
// (event_guests) — no account, no points, just an attendance record for
// metrics. Only used for events that actually exist in the events table;
// the hardcoded sample events keep using the existing local-only
// EventSignupForm instead.
export default function DbEventRsvp({ eventId }: { eventId: string }) {
  const supabase = createClient();
  const [status, setStatus] = useState<'loading' | 'signedOut' | 'signedIn'>('loading');
  const [rsvped, setRsvped] = useState(false);
  const [pending, setPending] = useState(false);

  const [guestName, setGuestName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [guestStatus, setGuestStatus] = useState('');
  const [guestDone, setGuestDone] = useState(false);

  const [yearOfStudy, setYearOfStudy] = useState('');
  const [questions, setQuestions] = useState('');
  const [rsvpError, setRsvpError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (!cancelled) setStatus('signedOut');
        return;
      }

      const { data } = await supabase
        .from('event_rsvps')
        .select('event_id')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!cancelled) {
        setRsvped(!!data);
        setStatus('signedIn');
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [eventId, supabase]);

  async function handleRsvpSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRsvpError('');
    setPending(true);
    try {
      await toggleRsvp(eventId, true, yearOfStudy, questions);
      setRsvped(true);
    } catch (error) {
      setRsvpError(error instanceof Error ? error.message : 'Could not RSVP — try again.');
    }
    setPending(false);
  }

  async function handleCancelRsvp() {
    setPending(true);
    await toggleRsvp(eventId, false);
    setRsvped(false);
    setPending(false);
  }

  async function handleGuestSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setGuestStatus('');
    setPending(true);
    try {
      await registerGuest(eventId, guestName, studentId);
      setGuestDone(true);
    } catch (error) {
      setGuestStatus(error instanceof Error ? error.message : 'Could not register — try again.');
    }
    setPending(false);
  }

  if (status === 'loading') return null;

  if (status === 'signedOut') {
    if (guestDone) {
      return <p className={styles.success}>You&apos;re registered for this event.</p>;
    }

    return (
      <form className={styles.form} onSubmit={handleGuestSubmit} noValidate>
        <h3 className={styles.formTitle}>Register without an account</h3>
        <div className={styles.field}>
          <label htmlFor={`guest-name-${eventId}`}>Name</label>
          <input
            id={`guest-name-${eventId}`}
            value={guestName}
            onChange={(event) => setGuestName(event.target.value)}
            required
          />
        </div>
        <div className={styles.field}>
          <label htmlFor={`guest-student-id-${eventId}`}>Student ID</label>
          <input
            id={`guest-student-id-${eventId}`}
            value={studentId}
            onChange={(event) => setStudentId(event.target.value)}
            required
          />
        </div>
        {guestStatus && <p className={styles.formError}>{guestStatus}</p>}
        <div className={styles.formActions}>
          <button type="submit" className={styles.cta} disabled={pending}>
            {pending ? 'Registering…' : 'Register'}
          </button>
        </div>
      </form>
    );
  }

  if (rsvped) {
    return (
      <div className={styles.form}>
        <h3 className={styles.formTitle}>You&apos;re going!</h3>
        <div className={styles.formActions}>
          <button type="button" className={styles.cta} onClick={handleCancelRsvp} disabled={pending}>
            Cancel RSVP
          </button>
        </div>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleRsvpSubmit} noValidate>
      <h3 className={styles.formTitle}>Sign up sheet</h3>
      <div className={`${styles.field} ${styles.fieldWide}`}>
        <label htmlFor={`year-${eventId}`}>Year of study</label>
        <select
          id={`year-${eventId}`}
          value={yearOfStudy}
          onChange={(event) => setYearOfStudy(event.target.value)}
          required
        >
          <option value="" disabled>
            Select year
          </option>
          {YEARS.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>
      <div className={`${styles.field} ${styles.fieldWide}`}>
        <label htmlFor={`questions-${eventId}`}>Questions (optional)</label>
        <textarea
          id={`questions-${eventId}`}
          value={questions}
          onChange={(event) => setQuestions(event.target.value)}
        />
      </div>
      {rsvpError && <p className={styles.formError}>{rsvpError}</p>}
      <div className={styles.formActions}>
        <button type="submit" className={styles.cta} disabled={pending}>
          {pending ? 'Signing up…' : 'RSVP'}
        </button>
      </div>
    </form>
  );
}
