'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import QrScanner from 'qr-scanner';

QrScanner.WORKER_PATH = '/qr-scanner-worker.min.js';

type EventOption = { id: string; title: string };
type Rsvp = { eventId: string; email: string; name: string; attended: boolean };

export default function CheckinScanner({
  events,
  rsvps,
}: {
  events: EventOption[];
  rsvps: Rsvp[];
}) {
  const [eventId, setEventId] = useState(events[0]?.id ?? '');
  const [feedback, setFeedback] = useState('');
  const [email, setEmail] = useState('');
  const [manualLoading, setManualLoading] = useState(false);
  const [justCheckedIn, setJustCheckedIn] = useState<Set<string>>(new Set());
  const videoRef = useRef<HTMLVideoElement>(null);
  const eventIdRef = useRef(eventId);
  const busyRef = useRef(false);

  useEffect(() => {
    eventIdRef.current = eventId;
  }, [eventId]);

  async function checkIn(body: { token: string } | { email: string }) {
    const response = await fetch('/api/admin/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, eventId: eventIdRef.current }),
    });
    const data = await response.json();

    setFeedback(
      response.ok
        ? `✅ ${data.name} checked in (+${data.points} pts)`
        : `⚠️ ${data.error ?? 'Check-in failed'}`
    );
    return response.ok;
  }

  useEffect(() => {
    if (!videoRef.current) return;

    async function handleScan(token: string) {
      if (busyRef.current || !eventIdRef.current) return;
      busyRef.current = true;
      await checkIn({ token });
      setTimeout(() => {
        busyRef.current = false;
      }, 1500);
    }

    const scanner = new QrScanner(videoRef.current, (result) => handleScan(result.data), {
      highlightScanRegion: true,
      highlightCodeOutline: true,
    });
    scanner.start().catch((error) => setFeedback(`Camera error: ${error.message ?? error}`));

    return () => {
      scanner.stop();
      scanner.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleManualSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!eventId || !email) return;
    setManualLoading(true);
    const ok = await checkIn({ email });
    setManualLoading(false);
    if (ok) setEmail('');
  }

  async function handleRsvpCheckIn(rsvp: Rsvp) {
    const ok = await checkIn({ email: rsvp.email });
    if (ok) setJustCheckedIn((prev) => new Set(prev).add(rsvp.email));
  }

  if (events.length === 0) {
    return <p>No events yet — create one above first.</p>;
  }

  const currentRsvps = rsvps.filter((rsvp) => rsvp.eventId === eventId);

  return (
    <div>
      <label>
        Event
        <select value={eventId} onChange={(event) => setEventId(event.target.value)}>
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.title}
            </option>
          ))}
        </select>
      </label>

      <video ref={videoRef} className="scanner-video" muted playsInline />

      <form className="auth-form" onSubmit={handleManualSubmit}>
        <label>
          Didn&apos;t scan? Check in by email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="member@email.com"
          />
        </label>
        <button type="submit" disabled={manualLoading}>
          {manualLoading ? 'Checking in…' : 'Mark attended'}
        </button>
      </form>

      {feedback && (
        <p role="status" aria-live="polite" className="scan-feedback">
          {feedback}
        </p>
      )}

      {currentRsvps.length > 0 && (
        <div>
          <h2>RSVP&apos;d ({currentRsvps.length})</h2>
          <ul className="rsvp-list">
            {currentRsvps.map((rsvp) => {
              const attended = rsvp.attended || justCheckedIn.has(rsvp.email);
              return (
                <li key={rsvp.email}>
                  {rsvp.name}{' '}
                  {attended ? (
                    '✅'
                  ) : (
                    <button type="button" className="link-button" onClick={() => handleRsvpCheckIn(rsvp)}>
                      Check in
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
