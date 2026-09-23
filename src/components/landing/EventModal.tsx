'use client';

import { useEffect, useId, useRef } from 'react';
import type { ClubEvent } from '@/types/landing';
import { isEventUpcoming } from '@/lib/eventSchedule';
import EventSignupForm from './EventSignupForm';
import DbEventRsvp from './DbEventRsvp';
import styles from './landing.module.css';
import formStyles from '../careers/careers.module.css';

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
          <div>
            <p className={formStyles.applyEyebrow}>Event</p>
            <h2 id={titleId} className={formStyles.applyTitle}>
              {event.title}
            </h2>
          </div>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className={formStyles.applyMeta}>
          <span>{formatDate(event.date)}</span>
          <span>{event.time}</span>
          <span>{event.location}</span>
        </div>
        <p className={formStyles.applyDescription}>{event.description}</p>
        {event.images.length > 0 ? (
          <div className={styles.imageRow}>
            {event.images.map((src) => (
              <img key={src} src={src} alt="" />
            ))}
          </div>
        ) : null}
        {isEventUpcoming(event) ? (
          <div className={styles.rsvp}>
            <p className={formStyles.applyEyebrow}>RSVP</p>
            {UUID_PATTERN.test(event.id) ? (
              <DbEventRsvp eventId={event.id} />
            ) : (
              <EventSignupForm eventTitle={event.title} />
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
