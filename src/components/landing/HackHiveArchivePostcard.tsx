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

const POLAROID_TILTS = [-8, 4, -3, 6] as const;

export default function HackHiveArchivePostcard({
  projects,
}: HackHiveArchivePostcardProps) {
  const [progress, setProgress] = useState(0);
  const [interactable, setInteractable] = useState(false);
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
            See how 3&nbsp;a.m. ideas became first-place builds.
          </h2>
          <p className={styles.archiveSubline}>
            HackHive &apos;24 · &apos;25 · &apos;26
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
              const isLast = idx === 3;

              return (
                <Link
                  key={project.id}
                  href="/hackhive"
                  className={`${styles.archivePolaroid} ${isLast ? styles.archivePolaroidCropped : ''}`}
                  style={
                    {
                      '--tilt': `${tilt}deg`,
                      opacity: pinProgress,
                      transform: `translateY(${dropY}px) rotate(${tilt}deg)`,
                      pointerEvents: interactable ? 'auto' : 'none',
                    } as CSSProperties
                  }
                  tabIndex={interactable ? 0 : -1}
                  aria-label={`View ${project.title}`}
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
                      sizes="120px"
                    />
                  </div>
                  <span className={styles.archivePolaroidCaption}>
                    {project.title}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
