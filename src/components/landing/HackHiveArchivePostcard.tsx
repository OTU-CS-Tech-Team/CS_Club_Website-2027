'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { HackHiveProject } from '@/types/hackhive';
import styles from './landing.module.css';

type HackHiveArchivePostcardProps = {
  projects: HackHiveProject[];
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

const POLAROID_TILTS = [-6, 2, -4, 5] as const;
const POLAROID_YEARS = ["'24", "'25", "'26", "'26"] as const;

export default function HackHiveArchivePostcard({
  projects,
}: HackHiveArchivePostcardProps) {
  const [progress, setProgress] = useState(0);
  const [interactable, setInteractable] = useState(false);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const sectionRef = useRef<HTMLElement>(null);

  const polaroids = projects.slice(0, 4);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    if (reduceMotion) {
      setProgress(1);
      setInteractable(true);
      return;
    }

    let raf = 0;
    const update = () => {
      raf = 0;
      const total = section.offsetHeight - window.innerHeight;
      if (total <= 0) {
        setProgress(1);
        setInteractable(true);
        return;
      }
      const next = clamp(-section.getBoundingClientRect().top / total, 0, 1);
      setProgress((prev) => (Math.abs(prev - next) < 0.001 ? prev : next));
      setInteractable(next >= 0.9);
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

  const lavenderRise = easeOutCubic(clamp((progress - 0.25) / 0.2, 0, 1));

  const stripOpacity = easeOutCubic(clamp((progress - 0.25) / 0.2, 0, 1));
  const stripScale = 0.97 + 0.03 * easeOutCubic(clamp((progress - 0.25) / 0.2, 0, 1));

  const polaroidBase = 0.45;
  const polaroidSpan = 0.3 / 4;

  const copyOpacity = easeOutCubic(clamp((progress - 0.75) / 0.15, 0, 1));
  const copyY = 16 * (1 - easeOutCubic(clamp((progress - 0.75) / 0.15, 0, 1)));

  const shimmerOpacity = easeOutCubic(clamp((progress - 0.9) / 0.1, 0, 1));

  return (
    <section
      ref={sectionRef}
      className={styles.archiveChapter}
      aria-labelledby="archive-heading"
    >
      <div
        className={styles.archiveWash}
        style={{ transform: `translateY(${100 - lavenderRise * 100}%)` } as CSSProperties}
        aria-hidden="true"
      />

      <div className={styles.archiveFrame}>
        <div
          className={styles.archiveCopy}
          style={
            {
              opacity: copyOpacity,
              transform: `translateY(${copyY}px)`,
            } as CSSProperties
          }
        >
          <p className={styles.archiveChapterIndex}>
            <span>04</span>
            <span className={styles.archiveIndexRule} aria-hidden="true" />
            <span>Archive</span>
          </p>
          <h2 id="archive-heading" className={styles.archiveHeadline}>
            See how 3&nbsp;a.m. <em>ideas</em> became first-place <em>builds</em>.
          </h2>
          <p className={styles.archiveSubline}>
            A peek at HackHive &apos;24 · &apos;25 · &apos;26 — the rest is in the museum.
          </p>
          <Link
            href="/hackhive"
            className={styles.archiveCta}
            style={{ pointerEvents: interactable ? 'auto' : 'none' } as CSSProperties}
          >
            Explore the archive <span aria-hidden="true">→</span>
          </Link>
        </div>

        <div
          className={styles.archiveStripWrap}
          style={
            {
              opacity: stripOpacity,
              transform: `scale(${stripScale})`,
            } as CSSProperties
          }
        >
          <div className={styles.archiveStrip}>
            <div
              className={styles.archiveShimmer}
              style={{ opacity: shimmerOpacity } as CSSProperties}
              aria-hidden="true"
            />
            {polaroids.map((project, idx) => {
              const pinProgress = easeOutCubic(
                clamp((progress - (polaroidBase + idx * polaroidSpan)) / 0.08, 0, 1)
              );
              const dropY = 12 * (1 - pinProgress);
              const pinSquash = 1 - 0.15 * (1 - pinProgress);
              const tilt = POLAROID_TILTS[idx % POLAROID_TILTS.length];
              const year = POLAROID_YEARS[idx % POLAROID_YEARS.length];
              const isLast = idx === 3;
              const isHovered = hoveredIdx === idx && interactable;

              return (
                <Link
                  key={project.id}
                  href="/hackhive"
                  className={`${styles.archivePolaroid} ${isLast ? styles.archivePolaroidCropped : ''}`}
                  style={
                    {
                      '--tilt': `${tilt}deg`,
                      opacity: pinProgress,
                      transform: isHovered
                        ? `translateY(-12px) rotate(0deg) scale(1.08)`
                        : `translateY(${dropY}px) rotate(${tilt}deg)`,
                      pointerEvents: interactable ? 'auto' : 'none',
                      zIndex: isHovered ? 20 : 1,
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
                    style={{ transform: `scaleY(${pinSquash})` } as CSSProperties}
                    aria-hidden="true"
                  />
                  <div className={styles.archivePolaroidPhoto}>
                    <Image
                      src={project.thumbnail ?? '/events/workshop.svg'}
                      alt={project.title}
                      width={200}
                      height={200}
                      sizes="140px"
                    />
                  </div>
                  <div className={styles.archivePolaroidCaption}>
                    <span className={styles.archivePolaroidYear}>
                      HackHive {year}
                    </span>
                    <span className={styles.archivePolaroidAward}>
                      <svg
                        className={styles.archiveTrophyIcon}
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path d="M5 3h14v2h-1v1c0 2.8-1.7 5.2-4.1 6.3.1.5.1 1 .1 1.7v2h2v2H8v-2h2v-2c0-.7 0-1.2.1-1.7C7.7 11.2 6 8.8 6 6V5H5V3zm2 3c0 2.2 1.8 4 4 4s4-1.8 4-4V5H7v1zm-4 0h2v1c0 1.1.2 2.1.6 3H3V6zm18 0v4h-2.6c.4-.9.6-1.9.6-3V6h2z" />
                      </svg>
                      1st Place
                    </span>
                  </div>
                  {isHovered && (
                    <div className={styles.archivePolaroidTooltip}>
                      <span className={styles.archiveTooltipTitle}>{project.title}</span>
                      <span className={styles.archiveTooltipSub}>
                        {project.category ? `${project.category} · ` : ''}click to enter museum
                      </span>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
          <p
            className={styles.archiveHint}
            style={{ opacity: shimmerOpacity } as CSSProperties}
          >
            <span className={styles.archiveHintStar} aria-hidden="true">✦</span>
            Hover a polaroid to peek
          </p>
        </div>
      </div>
    </section>
  );
}
