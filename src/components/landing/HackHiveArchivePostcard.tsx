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

function easeOutExpo(t: number) {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

function easeOutQuart(t: number) {
  return 1 - Math.pow(1 - t, 4);
}

function easeOutBack(t: number) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

function smoothProgress(current: number, target: number, factor: number) {
  return current + (target - current) * factor;
}

const POLAROID_TILTS = [-7, 3, -4, 6] as const;
const POLAROID_YEARS = ["'24", "'25", "'26", "'26"] as const;

export default function HackHiveArchivePostcard({
  projects,
}: HackHiveArchivePostcardProps) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [displayProgress, setDisplayProgress] = useState(0);
  const [interactable, setInteractable] = useState(false);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const displayProgressRef = useRef(0);

  const polaroids = projects.slice(0, 4);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    if (reduceMotion) {
      setScrollProgress(1);
      setDisplayProgress(1);
      setInteractable(true);
      return;
    }

    let raf = 0;
    let animating = false;

    const animate = () => {
      const target = scrollProgress;
      const current = displayProgressRef.current;
      const next = smoothProgress(current, target, 0.065);

      if (Math.abs(next - current) > 0.0005) {
        displayProgressRef.current = next;
        setDisplayProgress(next);
        animating = true;
        raf = window.requestAnimationFrame(animate);
      } else {
        displayProgressRef.current = target;
        setDisplayProgress(target);
        animating = false;
      }
    };

    const update = () => {
      const total = section.offsetHeight - window.innerHeight;
      if (total <= 0) {
        setScrollProgress(1);
        setInteractable(true);
        return;
      }
      const raw = clamp(-section.getBoundingClientRect().top / total, 0, 1);
      setScrollProgress(raw);
      setInteractable(raw >= 0.92);

      if (!animating) {
        animating = true;
        raf = window.requestAnimationFrame(animate);
      }
    };

    const onScroll = () => {
      update();
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [scrollProgress]);

  const p = displayProgress;

  const lavenderRise = easeOutExpo(clamp((p - 0.08) / 0.22, 0, 1));

  const stripOpacity = easeOutQuart(clamp((p - 0.22) / 0.2, 0, 1));
  const stripScale = 0.94 + 0.06 * easeOutQuart(clamp((p - 0.22) / 0.24, 0, 1));
  const stripY = 20 * (1 - easeOutQuart(clamp((p - 0.22) / 0.24, 0, 1)));

  const chapterOpacity = easeOutExpo(clamp((p - 0.68) / 0.14, 0, 1));
  const chapterY = 10 * (1 - easeOutExpo(clamp((p - 0.68) / 0.14, 0, 1)));

  const headlineOpacity = easeOutExpo(clamp((p - 0.72) / 0.14, 0, 1));
  const headlineY = 18 * (1 - easeOutExpo(clamp((p - 0.72) / 0.16, 0, 1)));

  const sublineOpacity = easeOutExpo(clamp((p - 0.78) / 0.12, 0, 1));
  const sublineY = 12 * (1 - easeOutExpo(clamp((p - 0.78) / 0.14, 0, 1)));

  const ctaOpacity = easeOutExpo(clamp((p - 0.84) / 0.12, 0, 1));
  const ctaY = 10 * (1 - easeOutExpo(clamp((p - 0.84) / 0.14, 0, 1)));

  const shimmerOpacity = easeOutExpo(clamp((p - 0.88) / 0.12, 0, 1));
  const hintOpacity = easeOutExpo(clamp((p - 0.92) / 0.08, 0, 1));

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
        <div className={styles.archiveCopy}>
          <p
            className={styles.archiveChapterIndex}
            style={
              {
                opacity: chapterOpacity,
                transform: `translateY(${chapterY}px)`,
              } as CSSProperties
            }
          >
            <span>04</span>
            <span className={styles.archiveIndexRule} aria-hidden="true" />
            <span>Archive</span>
          </p>
          <h2
            id="archive-heading"
            className={styles.archiveHeadline}
            style={
              {
                opacity: headlineOpacity,
                transform: `translateY(${headlineY}px)`,
              } as CSSProperties
            }
          >
            See how 3&nbsp;a.m. <em>ideas</em> became first-place <em>builds</em>.
          </h2>
          <p
            className={styles.archiveSubline}
            style={
              {
                opacity: sublineOpacity,
                transform: `translateY(${sublineY}px)`,
              } as CSSProperties
            }
          >
            A peek at HackHive &apos;24 · &apos;25 · &apos;26 — the rest is in the museum.
          </p>
          <Link
            href="/hackhive"
            className={styles.archiveCta}
            style={
              {
                opacity: ctaOpacity,
                transform: `translateY(${ctaY}px)`,
                pointerEvents: interactable ? 'auto' : 'none',
              } as CSSProperties
            }
          >
            Explore the archive <span aria-hidden="true">→</span>
          </Link>
        </div>

        <div
          className={styles.archiveStripWrap}
          style={
            {
              opacity: stripOpacity,
              transform: `translateY(${stripY}px) scale(${stripScale})`,
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
              const baseDelay = 0.38;
              const stagger = 0.08;
              const pinStart = baseDelay + idx * stagger;
              
              const pinProgress = easeOutBack(clamp((p - pinStart) / 0.14, 0, 1));
              const dropY = 18 * (1 - pinProgress);
              const pinSquash = 0.7 + 0.3 * pinProgress;
              const polaroidOpacity = easeOutQuart(clamp((p - pinStart) / 0.1, 0, 1));
              
              const tilt = POLAROID_TILTS[idx % POLAROID_TILTS.length];
              const year = POLAROID_YEARS[idx % POLAROID_YEARS.length];
              const isLast = idx === 3;
              const isHovered = hoveredIdx === idx && interactable;

              return (
                <Link
                  key={project.id}
                  href="/hackhive"
                  className={`${styles.archivePolaroid} ${isLast ? styles.archivePolaroidCropped : ''} ${isHovered ? styles.archivePolaroidHovered : ''}`}
                  style={
                    {
                      '--tilt': `${tilt}deg`,
                      '--drop-y': `${dropY}px`,
                      opacity: polaroidOpacity,
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
            style={{ opacity: hintOpacity } as CSSProperties}
          >
            <span className={styles.archiveHintStar} aria-hidden="true">✦</span>
            Hover a polaroid to peek
          </p>
        </div>
      </div>
    </section>
  );
}
