'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { HackHiveProject } from '@/types/hackhive';
import { getProjectHref } from '@/data/hackhive';
import styles from './landing.module.css';

type HackHiveArchivePostcardProps = {
  projects: HackHiveProject[];
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function easeOutQuart(t: number) {
  return 1 - Math.pow(1 - t, 4);
}

function easeOutBack(t: number) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

const POLAROID_TILTS = [-7, 3, -4, 6] as const;

function hackHiveYearLabel(year: number) {
  return `'${String(year).slice(-2)}`;
}

/** Short label for the polaroid footer — from corkboard annotations when present. */
function archiveAwardLabel(project: HackHiveProject): string {
  const raw = project.annotation?.text?.trim();
  if (!raw) return project.category ?? 'HackHive project';

  const lower = raw.toLowerCase();
  if (lower.includes('first place')) return '1st Place';
  if (lower.includes('second place')) return '2nd Place';
  if (lower.includes('third place')) return '3rd Place';

  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function showTrophy(project: HackHiveProject) {
  const lower = project.annotation?.text?.toLowerCase() ?? '';
  return (
    lower.includes('first place') ||
    lower.includes('second place') ||
    lower.includes('third place')
  );
}

export default function HackHiveArchivePostcard({
  projects,
}: HackHiveArchivePostcardProps) {
  const [progress, setProgress] = useState(0);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const sectionRef = useRef<HTMLElement>(null);

  const polaroids = projects.slice(0, 4);
  const interactable = progress >= 0.82;

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    if (reduceMotion) {
      setProgress(1);
      return;
    }

    let raf = 0;
    const update = () => {
      raf = 0;
      const total = section.offsetHeight - window.innerHeight;
      const next =
        total <= 0
          ? 1
          : clamp(-section.getBoundingClientRect().top / total, 0, 1);
      setProgress((prev) => (Math.abs(prev - next) < 0.002 ? prev : next));
    };

    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  const hintOpacity = easeOutQuart(clamp((progress - 0.75) / 0.2, 0, 1));

  return (
    <section
      ref={sectionRef}
      className={styles.archiveChapter}
      aria-labelledby="archive-heading"
    >
      <div className={styles.archiveFrame}>
        <div className={styles.archiveCopy}>
          <p className={styles.archiveChapterIndex}>
            <span>04</span>
            <span className={styles.archiveIndexRule} aria-hidden="true" />
            <span>Archive</span>
          </p>
          <h2 id="archive-heading" className={styles.archiveHeadline}>
            See how 3&nbsp;a.m. <em>ideas</em> became first-place <em>builds</em>.
          </h2>
          <p className={styles.archiveSubline}>
            A peek at HackHive &apos;24 · &apos;25 · &apos;26 — the rest is in the
            museum.
          </p>
          <Link href="/hackhive" className={styles.archiveCta}>
            Explore HackHive museum <span aria-hidden="true">→</span>
          </Link>
        </div>

        <div className={styles.archiveStripWrap}>
          <div className={styles.archiveStrip}>
            {polaroids.map((project, idx) => {
              // Stickies only — board + copy are already on screen.
              const start = 0.08 + idx * 0.16;
              const local = easeOutBack(clamp((progress - start) / 0.22, 0, 1));
              const dropY = 56 * (1 - local);
              const pinSquash = 0.65 + 0.35 * local;
              const tilt = POLAROID_TILTS[idx % POLAROID_TILTS.length];
              const year = hackHiveYearLabel(project.year);
              const award = archiveAwardLabel(project);
              const trophy = showTrophy(project);
              const isHovered = hoveredIdx === idx && interactable;

              return (
                <Link
                  key={project.id}
                  href={getProjectHref(project.id)}
                  className={`${styles.archivePolaroid} ${isHovered ? styles.archivePolaroidHovered : ''}`}
                  style={
                    {
                      '--tilt': `${tilt}deg`,
                      '--drop-y': `${dropY}px`,
                      opacity: local,
                      pointerEvents: interactable ? 'auto' : 'none',
                    } as CSSProperties
                  }
                  tabIndex={interactable ? 0 : -1}
                  aria-label={`View ${project.title}`}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  onFocus={() => setHoveredIdx(idx)}
                  onBlur={() => setHoveredIdx(null)}
                >
                  <span
                    className={styles.archivePin}
                    style={
                      { transform: `scaleY(${pinSquash})` } as CSSProperties
                    }
                    aria-hidden="true"
                  />
                  <div className={styles.archivePolaroidPhoto}>
                    <Image
                      src={project.thumbnail ?? '/events/workshop.svg'}
                      alt={project.title}
                      width={200}
                      height={200}
                      sizes="180px"
                    />
                  </div>
                  <div className={styles.archivePolaroidCaption}>
                    <span className={styles.archivePolaroidYear}>
                      HackHive {year}
                    </span>
                    <span className={styles.archivePolaroidAward}>
                      {trophy ? (
                        <svg
                          className={styles.archiveTrophyIcon}
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path d="M5 3h14v2h-1v1c0 2.8-1.7 5.2-4.1 6.3.1.5.1 1 .1 1.7v2h2v2H8v-2h2v-2c0-.7 0-1.2.1-1.7C7.7 11.2 6 8.8 6 6V5H5V3zm2 3c0 2.2 1.8 4 4 4s4-1.8 4-4V5H7v1zm-4 0h2v1c0 1.1.2 2.1.6 3H3V6zm18 0v4h-2.6c.4-.9.6-1.9.6-3V6h2z" />
                        </svg>
                      ) : null}
                      {award}
                    </span>
                  </div>
                  {isHovered ? (
                    <div className={styles.archivePolaroidTooltip}>
                      <span className={styles.archiveTooltipTitle}>
                        {project.title}
                      </span>
                      <span className={styles.archiveTooltipSub}>
                        {project.category ? `${project.category} · ` : ''}
                        view demo & details
                      </span>
                    </div>
                  ) : null}
                </Link>
              );
            })}
          </div>
          <p
            className={styles.archiveHint}
            style={{ opacity: hintOpacity } as CSSProperties}
          >
            <span className={styles.archiveHintStar} aria-hidden="true">
              ✦
            </span>
            Hover a polaroid to peek
          </p>
        </div>
      </div>
    </section>
  );
}
