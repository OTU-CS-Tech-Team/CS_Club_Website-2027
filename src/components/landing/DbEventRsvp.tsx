'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toggleRsvp } from '@/app/events/actions';
import styles from './landing.module.css';

// RSVP control for a real, DB-backed event — persists to event_rsvps via
// the signed-in member's own session. Only used for events that actually
// exist in the events table; the hardcoded sample events keep using the
// existing local-only EventSignupForm instead.
export default function DbEventRsvp({ eventId }: { eventId: string }) {
  const supabase = createClient();
  const [status, setStatus] = useState<'loading' | 'signedOut' | 'signedIn'>('loading');
  const [rsvped, setRsvped] = useState(false);
  const [pending, setPending] = useState(false);

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

  async function handleClick() {
    const next = !rsvped;
    setRsvped(next);
    setPending(true);
    await toggleRsvp(eventId, next);
    setPending(false);
  }

  if (status === 'loading') return null;

  if (status === 'signedOut') {
    return (
      <p className={styles.success}>
        <a href="/login">Log in</a> to RSVP for this event.
      </p>
    );
  }

  return (
    <button type="button" className={styles.cta} onClick={handleClick} disabled={pending}>
      {rsvped ? "You're going ✓ — cancel" : 'RSVP'}
    </button>
  );
}
