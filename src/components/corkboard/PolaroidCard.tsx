import type { CSSProperties } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { HackHiveProject } from '@/types/hackhive';
import { getProjectHref } from '@/data/hackhive';
import styles from './corkboard.module.css';

type PolaroidCardProps = {
  project: HackHiveProject;
  compact?: boolean;
  handwrittenClass?: string;
};

export default function PolaroidCard({
  project,
  compact = false,
  handwrittenClass,
}: PolaroidCardProps) {
  const pinClass =
    project.pinColor === 'green' ? styles.pinGreen : styles.pinRed;

  return (
    <Link
      href={getProjectHref(project.id)}
      className={`${styles.polaroid} ${compact ? styles.polaroidCompact : ''}`}
      style={{ '--tilt': `${project.rotation}deg` } as CSSProperties}
      aria-label={`View ${project.title}`}
    >
      {project.attachment === 'pin' && (
        <span className={`${styles.pin} ${pinClass}`} aria-hidden />
      )}
      {project.attachment === 'tape' && (
        <span className={styles.tape} aria-hidden />
      )}
      <div className={styles.polaroidPhoto}>
        <Image
          src={project.thumbnail}
          alt={project.title}
          width={400}
          height={400}
          sizes={compact ? '120px' : '180px'}
        />
      </div>
      <div className={styles.polaroidCaption}>
        <h3 className={`${styles.polaroidTitle} ${handwrittenClass ?? ''}`}>
          {project.title}
        </h3>
        <p className={styles.polaroidCategory}>{project.category}</p>
      </div>
    </Link>
  );
}
