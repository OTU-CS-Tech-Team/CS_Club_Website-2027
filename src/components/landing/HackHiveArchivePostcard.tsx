'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { HackHiveProject } from '@/types/hackhive';
import { getProjectHref } from '@/data/hackhive';
import { useChapterScrollGate } from '@/hooks/useChapterScrollGate';
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
const FLY_FROM = [
  { x: -48, y: 110, rot: -18 },
  { x: 36, y: 130, rot: 14 },
  { x: -28, y: 120, rot: -12 },
  { x: 52, y: 140, rot: 20 },
] as const;

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
  const maxProgressRef = useRef(0);
  const settledRef = useRef(false);

  // Last polaroid: start 0.06 + 3*0.18, duration 0.24 → done at 0.84
  const lastFlyInDone =
    polaroids.length > 0
      ? 0.06 + (polaroids.length - 1) * 0.18 + 0.24
      : 0.84;

  useChapterScrollGate(sectionRef, lastFlyInDone);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    );
    const staticLayout = window.matchMedia('(max-width: 860px)');

    const showFinished = () => {
      settledRef.current = true;
      setProgress(1);
    };

    if (reduceMotion.matches || staticLayout.matches) {
      showFinished();
      return;
    }

    let raf = 0;
    const update = () => {
      raf = 0;

      // Notes already landed — stay pinned; scroll-up must not pull them off.
      if (settledRef.current) {
        setProgress((prev) => (prev === 1 ? prev : 1));
        return;
      }

      const total = section.offsetHeight - window.innerHeight;
      const next =
        total <= 0
          ? 1
          : clamp(-section.getBoundingClientRect().top / total, 0, 1);
      const latched = Math.max(maxProgressRef.current, next);
      maxProgressRef.current = latched;

      if (latched >= lastFlyInDone) {
        settledRef.current = true;
        setProgress(1);
      } else {
        setProgress((prev) =>
          Math.abs(prev - latched) < 0.002 ? prev : latched,
        );
      }
    };

    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(update);
    };

    const onBreakpoint = () => {
      if (reduceMotion.matches || staticLayout.matches) {
        showFinished();
      }
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    reduceMotion.addEventListener('change', onBreakpoint);
    staticLayout.addEventListener('change', onBreakpoint);
    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      reduceMotion.removeEventListener('change', onBreakpoint);
      staticLayout.removeEventListener('change', onBreakpoint);
    };
  }, [lastFlyInDone]);

  const hintOpacity = easeOutQuart(clamp((progress - 0.75) / 0.2, 0, 1));

  return (
    <section
      ref={sectionRef}
      className={styles.archiveChapter}
      aria-labelledby="archive-heading"
    >
      <div className={styles.archiveFrame}>
        <p className={styles.archiveChapterIndex}>
          <span>04</span>
          <span className={styles.archiveIndexRule} aria-hidden="true" />
          <span>HackHive Museum</span>
        </p>
        <div className={styles.archiveCopy}>
          <h2 id="archive-heading" className={styles.archiveHeadline}>
            See how 3&nbsp;a.m. <em>ideas</em> became first-place <em>builds</em>.
          </h2>
          <p className={styles.archiveSubline}>
            Peek into the history of HackHive &apos;26 &apos;25 &apos;24
          </p>
          <Link href="/hackhive/archive" className={styles.archiveCta}>
            Explore HackHive <span aria-hidden="true">→</span>
          </Link>
        </div>

        <div className={styles.archiveStripWrap}>
          <div className={styles.archiveStrip}>
            {polaroids.map((project, idx) => {
              // One-by-one pin throws as you scroll through the chapter.
              const start = 0.06 + idx * 0.18;
              const local = easeOutBack(clamp((progress - start) / 0.24, 0, 1));
              const from = FLY_FROM[idx % FLY_FROM.length];
              const dropY = from.y * (1 - local);
              const flyX = from.x * (1 - local);
              const flyRot = from.rot * (1 - local);
              const pinSquash = 0.55 + 0.45 * local;
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
                      '--fly-x': `${flyX}px`,
                      '--fly-rot': `${tilt + flyRot}deg`,
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
