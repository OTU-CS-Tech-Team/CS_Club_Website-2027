import Link from 'next/link';
import CorkboardWall from '@/components/corkboard/CorkboardWall';
import type { HackHiveProject } from '@/types/hackhive';
import styles from './landing.module.css';

type HackHiveExhibitionProps = {
  projects: HackHiveProject[];
  handwrittenClass?: string;
};

export default function HackHiveExhibition({
  projects,
  handwrittenClass,
}: HackHiveExhibitionProps) {
  return (
    <section className={styles.section} aria-labelledby="hackhive-heading">
      <p className={styles.chapterIndex}>
        <span>04</span>
        <span className={styles.chapterIndexRule} aria-hidden="true" />
        <span>HackHive</span>
      </p>
      <div className={styles.sectionHead}>
        <h2 id="hackhive-heading" className={styles.sectionTitle}>
          HackHive Exhibition
        </h2>
        <Link href="/hackhive" className={`${styles.textLink} ${styles.textLinkArrow}`}>
          View full exhibition
        </Link>
      </div>
      <p className={styles.exhibitionIntro}>
        HackHive 2026 drew 600+ applications and became the biggest hackathon in the
        Durham Region. Teams shipped under real constraints — including a last-day
        snowstorm — and the projects below are a sample of what landed on the floor.
      </p>
      <CorkboardWall
        projects={projects}
        showStickyNote
        embedded
        handwrittenClass={handwrittenClass}
      />
    </section>
  );
}
