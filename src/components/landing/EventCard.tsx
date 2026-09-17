import type { ClubEvent } from '@/types/landing';
import styles from './landing.module.css';
import { useHoverSound } from '@/hooks/useHoverSound';

type EventCardProps = {
  event: ClubEvent;
  featured?: boolean;
  onSelect: (event: ClubEvent) => void;
  playHoverSound?: boolean;
};

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('en-CA', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(`${iso}T12:00:00`));
}

export default function EventCard({ event, featured, onSelect, playHoverSound = false }: EventCardProps) {
  const playHover = useHoverSound();

  return (
    <button
      type="button"
      className={`${styles.eventCard} ${featured ? styles.eventCardFeatured : ''}`}
      onClick={() => onSelect(event)}
      onMouseEnter={playHoverSound ? playHover : undefined}
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
