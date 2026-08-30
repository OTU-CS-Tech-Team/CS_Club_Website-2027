import type { CorkboardAnnotation } from '@/types/hackhive';
import styles from './corkboard.module.css';

type AnnotationProps = {
  annotation: CorkboardAnnotation;
  handwrittenClass?: string;
};

function Arrow({ pointing }: { pointing: 'up' | 'down' }) {
  return (
    <svg
      className={styles.scribbleArrow}
      viewBox="0 0 28 36"
      aria-hidden
    >
      {pointing === 'down' ? (
        <>
          <path
            d="M15 2c3 8-2 14 1 22 1 3 2 6 1 10"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M8 26l8 9 9-10"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      ) : (
        <>
          <path
            d="M14 34c-2-8 3-14 0-22-1-3-2-6-1-10"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M7 12l8-9 8 10"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
    </svg>
  );
}

export default function Annotation({
  annotation,
  handwrittenClass,
}: AnnotationProps) {
  return (
    <p
      className={`${styles.scribble} ${styles[`scribble${annotation.placement === 'top' ? 'Top' : 'Bottom'}`]} ${handwrittenClass ?? ''}`}
    >
      {annotation.placement === 'bottom' && <Arrow pointing="up" />}
      <span className={styles.scribbleText}>{annotation.text}</span>
      {annotation.placement === 'top' && <Arrow pointing="down" />}
    </p>
  );
}
