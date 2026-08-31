'use client';

import { useState, useTransition } from 'react';
import { toggleRsvp } from './actions';

export default function RsvpButton({
  eventId,
  initialRsvped,
}: {
  eventId: string;
  initialRsvped: boolean;
}) {
  const [rsvped, setRsvped] = useState(initialRsvped);
  const [pending, startTransition] = useTransition();

  function handleClick() {
    const next = !rsvped;
    setRsvped(next);
    startTransition(async () => {
      await toggleRsvp(eventId, next);
    });
  }

  return (
    <button type="button" className="link-button" onClick={handleClick} disabled={pending}>
      {rsvped ? "You're going ✓ — cancel" : 'RSVP'}
    </button>
  );
}
