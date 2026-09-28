'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toggleRsvp, registerGuest, getLoggedInRsvpState } from '@/app/events/actions';
// Styled to match the general member application form, not the landing forms.
import styles from '../careers/careers.module.css';

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
  const [suggestions, setSuggestions] = useState('');
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
      const result = await toggleRsvp(eventId, true, suggestions);
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
      const result = await registerGuest(
        eventId,
        guestName,
        studentId,
        guestEmail,
        suggestions,
      );
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
        <div className={styles.success}>
          <h3>Check your email.</h3>
          <p>Confirm your RSVP from the link we sent. It does not count until you confirm.</p>
          {emailWarning ? <p className={styles.formError}>{emailWarning}</p> : null}
        </div>
      );
    }

    return (
      <form onSubmit={handleGuestSubmit} noValidate>
        <p className={styles.note}>Not signed in? Enter your name, student ID, and email.</p>
        <div className={styles.formGrid}>
          <label>
            Name
            <input
              name="name"
              autoComplete="name"
              value={guestName}
              onChange={(event) => setGuestName(event.target.value)}
              aria-required="true"
            />
          </label>
          <label>
            Student ID
            <input
              name="studentId"
              inputMode="numeric"
              placeholder="100123456"
              value={studentId}
              onChange={(event) => setStudentId(event.target.value)}
              aria-required="true"
            />
          </label>
          <label className={styles.fullWidth}>
            Ontario Tech email
            <input
              type="email"
              name="email"
              autoComplete="email"
              placeholder="first.last@ontariotechu.net"
              value={guestEmail}
              onChange={(event) => setGuestEmail(event.target.value)}
              aria-required="true"
            />
          </label>
          <label className={styles.fullWidth}>
            Suggestions for future events (optional)
            <textarea
              name="suggestions"
              rows={4}
              maxLength={2000}
              placeholder="Anything you'd love the club to run next..."
              value={suggestions}
              onChange={(event) => setSuggestions(event.target.value)}
            />
          </label>
        </div>
        {guestStatus ? (
          <p className={styles.formError} role="alert">
            {guestStatus}
          </p>
        ) : null}
        <button type="submit" className={styles.submit} disabled={pending}>
          {pending ? 'Sending...' : 'RSVP'} <span aria-hidden="true">→</span>
        </button>
      </form>
    );
  }

  if (rsvped) {
    return (
      <div className={styles.success}>
        <h3>You&apos;re going!</h3>
        <p>See you there.</p>
        {emailWarning ? <p className={styles.formError}>{emailWarning}</p> : null}
        {rsvpError ? <p className={styles.formError}>{rsvpError}</p> : null}
        <button type="button" className={styles.submit} onClick={handleCancelRsvp} disabled={pending}>
          {pending ? 'Cancelling...' : 'Cancel RSVP'}
        </button>
      </div>
    );
  }

  return (
    <div>
      <p className={styles.note}>You&apos;re signed in, so we use your account details.</p>
      <div className={styles.formGrid}>
        <label className={styles.fullWidth}>
          Suggestions for future events (optional)
          <textarea
            name="suggestions"
            rows={4}
            maxLength={2000}
            placeholder="Anything you'd love the club to run next..."
            value={suggestions}
            onChange={(event) => setSuggestions(event.target.value)}
          />
        </label>
      </div>
      {rsvpError ? (
        <p className={styles.formError} role="alert">
          {rsvpError}
        </p>
      ) : null}
      <button type="button" className={styles.submit} onClick={handleRsvpClick} disabled={pending}>
        {pending ? 'RSVPing...' : 'RSVP'} <span aria-hidden="true">→</span>
      </button>
    </div>
  );
}
