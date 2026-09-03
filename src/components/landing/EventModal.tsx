'use client';

import { useEffect, useId, useRef } from 'react';
import type { ClubEvent } from '@/types/landing';
import { isEventUpcoming } from '@/lib/eventSchedule';
import EventSignupForm from './EventSignupForm';
import DbEventRsvp from './DbEventRsvp';
import styles from './landing.module.css';

// Real DB events have a uuid id; the hardcoded sample events use plain
// slugs like "leetcode-workshop" — that's how we tell them apart here.
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type EventModalProps = {
  event: ClubEvent;
  onClose: () => void;
};

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('en-CA', {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(`${iso}T12:00:00`));
}

export default function EventModal({ event, onClose }: EventModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    dialog?.focus();
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key !== 'Tab' || !dialog) {
        return;
      }

      const focusable = dialog.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea',
      );
      if (focusable.length === 0) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = originalOverflow;
      previous?.focus();
    };
  }, [onClose]);

  return (
    <div
      className={styles.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <div className={styles.dialogTop}>
          <h2 id={titleId} className={styles.dialogTitle}>
            {event.title}
          </h2>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <ul className={styles.dialogFacts}>
          <li className={styles.chip}>{formatDate(event.date)}</li>
          <li className={styles.chip}>{event.time}</li>
          <li className={styles.chip}>{event.location}</li>
        </ul>
        <p className={styles.dialogBody}>{event.description}</p>
        {event.images.length > 0 ? (
          <div className={styles.imageRow}>
            {event.images.map((src) => (
              <img key={src} src={src} alt="" />
            ))}
          </div>
        ) : null}
        {isEventUpcoming(event) ? (
          UUID_PATTERN.test(event.id) ? (
            <DbEventRsvp eventId={event.id} />
          ) : (
            <EventSignupForm eventTitle={event.title} />
          )
        ) : null}
      </div>
    </div>
  );
}
