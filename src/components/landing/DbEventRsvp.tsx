'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toggleRsvp, registerGuest, getLoggedInRsvpState } from '@/app/events/actions';
import styles from './landing.module.css';

// Logged-in: one RSVP button (name / email / student ID come from the account).
// Signed-out: collect those three fields as a guest registration + confirmation email.
export default function DbEventRsvp({ eventId }: { eventId: string }) {
  const supabase = createClient();
  const [status, setStatus] = useState<'loading' | 'signedOut' | 'signedIn'>('loading');
  const [rsvped, setRsvped] = useState(false);
  const [pending, setPending] = useState(false);
  const [rsvpError, setRsvpError] = useState('');
  const [emailWarning, setEmailWarning] = useState('');

  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [studentId, setStudentId] = useState('');
  const [guestStatus, setGuestStatus] = useState('');
  const [guestDone, setGuestDone] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadForUser(userId: string | undefined) {
      if (!userId) {
        if (!cancelled) {
          setRsvped(false);
          setStatus('signedOut');
        }
        return;
      }

      try {
        const { rsvped: alreadyGoing } = await getLoggedInRsvpState(eventId);
        if (!cancelled) {
          setRsvped(alreadyGoing);
          setStatus('signedIn');
        }
      } catch {
        if (!cancelled) {
          setRsvped(false);
          setStatus('signedIn');
        }
      }
    }

    async function load() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      await loadForUser(session?.user?.id);
    }

    load();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void loadForUser(session?.user?.id);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [eventId, supabase]);

  async function handleRsvpClick() {
    setRsvpError('');
    setEmailWarning('');
    setPending(true);
    try {
      const result = await toggleRsvp(eventId, true);
      setRsvped(true);
      if (result?.alreadyRegistered) {
        setEmailWarning("You've already RSVP'd!");
      } else if (result?.emailWarning) {
        setEmailWarning(result.emailWarning);
      }
    } catch (error) {
      setRsvpError(error instanceof Error ? error.message : 'Could not RSVP — try again.');
    }
    setPending(false);
  }

  async function handleCancelRsvp() {
    setRsvpError('');
    setEmailWarning('');
    setPending(true);
    try {
      await toggleRsvp(eventId, false);
      setRsvped(false);
    } catch (error) {
      setRsvpError(error instanceof Error ? error.message : 'Could not cancel RSVP — try again.');
    }
    setPending(false);
  }

  async function handleGuestSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setGuestStatus('');
    setEmailWarning('');
    setPending(true);
    try {
      const result = await registerGuest(eventId, guestName, studentId, guestEmail);
      setGuestDone(true);
      if (result.emailWarning) setEmailWarning(result.emailWarning);
    } catch (error) {
      setGuestStatus(error instanceof Error ? error.message : 'Could not register — try again.');
    }
    setPending(false);
  }

  if (status === 'loading') return null;

  if (status === 'signedOut') {
    if (guestDone) {
      return (
        <div className={styles.form}>
          <p className={styles.success}>
            Check your email to confirm your RSVP. It does not count until you confirm.
          </p>
          {emailWarning ? <p className={styles.formError}>{emailWarning}</p> : null}
        </div>
      );
    }

    return (
      <form className={styles.form} onSubmit={handleGuestSubmit} noValidate>
        <h3 className={styles.formTitle}>RSVP</h3>
        <p style={{ margin: '0 0 0.75rem', fontSize: '0.85rem', opacity: 0.85 }}>
          Not signed in — enter your name, student ID, and email.
        </p>
        <div className={styles.field}>
          <label htmlFor={`guest-name-${eventId}`}>Name</label>
          <input
            id={`guest-name-${eventId}`}
            value={guestName}
            onChange={(event) => setGuestName(event.target.value)}
            required
          />
        </div>
        <div className={`${styles.field} ${styles.fieldWide}`}>
          <label htmlFor={`guest-student-id-${eventId}`}>Student ID</label>
          <input
            id={`guest-student-id-${eventId}`}
            value={studentId}
            onChange={(event) => setStudentId(event.target.value)}
            required
          />
        </div>
        <div className={styles.field}>
          <label htmlFor={`guest-email-${eventId}`}>Email</label>
          <input
            id={`guest-email-${eventId}`}
            type="email"
            value={guestEmail}
            onChange={(event) => setGuestEmail(event.target.value)}
            required
          />
        </div>
        {guestStatus && <p className={styles.formError}>{guestStatus}</p>}
        <div className={styles.formActions}>
          <button type="submit" className={styles.cta} disabled={pending}>
            {pending ? 'Sending…' : 'RSVP'}
          </button>
        </div>
      </form>
    );
  }

  if (rsvped) {
    return (
      <div className={styles.form}>
        <h3 className={styles.formTitle}>You&apos;re going!</h3>
        {emailWarning ? <p className={styles.formError}>{emailWarning}</p> : null}
        {rsvpError ? <p className={styles.formError}>{rsvpError}</p> : null}
        <div className={styles.formActions}>
          <button type="button" className={styles.cta} onClick={handleCancelRsvp} disabled={pending}>
            Cancel RSVP
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.form}>
      <h3 className={styles.formTitle}>RSVP</h3>
      <p style={{ margin: '0 0 0.75rem', fontSize: '0.85rem', opacity: 0.85 }}>
        Signed in — one click uses your account details.
      </p>
      {rsvpError && <p className={styles.formError}>{rsvpError}</p>}
      <div className={styles.formActions}>
        <button type="button" className={styles.cta} onClick={handleRsvpClick} disabled={pending}>
          {pending ? 'RSVPing…' : 'RSVP'}
        </button>
      </div>
    </div>
  );
}
