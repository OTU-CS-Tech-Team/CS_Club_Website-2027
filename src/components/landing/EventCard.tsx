import type { ClubEvent } from '@/types/landing';
import styles from './landing.module.css';

type EventCardProps = {
  event: ClubEvent;
  featured?: boolean;
  onSelect: (event: ClubEvent) => void;
};

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('en-CA', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(`${iso}T12:00:00`));
}

export default function EventCard({ event, featured, onSelect }: EventCardProps) {
  return (
    <button
      type="button"
      className={`${styles.eventCard} ${featured ? styles.eventCardFeatured : ''}`}
      onClick={() => onSelect(event)}
    >
      <div className={styles.eventMeta}>
        <span className={styles.chip}>{formatDate(event.date)}</span>
        <span className={styles.chip}>{event.time}</span>
      </div>
      <h3 className={styles.eventTitle}>{event.title}</h3>
      <p className={styles.eventWhere}>{event.location}</p>
    </button>
  );
}
