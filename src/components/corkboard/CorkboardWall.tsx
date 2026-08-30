import type { HackHiveProject } from '@/types/hackhive';
import Annotation from './Annotation';
import PolaroidCard from './PolaroidCard';
import StickyNote from './StickyNote';
import styles from './corkboard.module.css';

type CorkboardWallProps = {
  projects: HackHiveProject[];
  title?: string;
  subtitle?: string;
  showStickyNote?: boolean;
  compact?: boolean;
  embedded?: boolean;
  handwrittenClass?: string;
};

export default function CorkboardWall({
  projects,
  title = 'hack the past — 2026 archive',
  subtitle = 'pinned projects from hackhive weekend',
  showStickyNote = true,
  compact = false,
  embedded = false,
  handwrittenClass,
}: CorkboardWallProps) {
  return (
    <div
      className={`${styles.board} ${compact ? styles.boardCompact : ''} ${embedded ? styles.embedded : ''}`}
    >
      {showStickyNote && <StickyNote handwrittenClass={handwrittenClass} />}
      {!compact && (
        <p className={`${styles.graffiti} ${handwrittenClass ?? ''}`}>
          CS Club Tech team was here
        </p>
      )}
      {!embedded && (
        <header className={styles.boardHeader}>
          <h2 className={`${styles.boardTitle} ${handwrittenClass ?? ''}`}>
            {title}
          </h2>
          {subtitle && (
            <p className={styles.boardSubtitle}>{subtitle}</p>
          )}
        </header>
      )}
      <div
        className={`${styles.polaroidGrid} ${compact ? styles.polaroidGridCompact : ''}`}
      >
        {projects.map((project) => (
          <div
            key={project.id}
            className={`${styles.polaroidSlot} ${compact ? styles.polaroidSlotCompact : ''}`}
          >
            {project.annotation && !compact && (
              <Annotation
                annotation={project.annotation}
                handwrittenClass={handwrittenClass}
              />
            )}
            <PolaroidCard
              project={project}
              compact={compact}
              handwrittenClass={handwrittenClass}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
