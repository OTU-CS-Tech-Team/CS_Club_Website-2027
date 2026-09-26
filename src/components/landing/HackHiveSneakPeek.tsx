'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { hackhiveSneakPeekClips } from '@/data/landing';
import HackHiveStripCanvas from './HackHiveStripCanvas';
import styles from './landing.module.css';

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

/** Film morph begins (matches HackHiveStripCanvas smoothstep start). */
const FILM_FORMING = 0.1;

export default function HackHiveSneakPeek() {
  const sectionRef = useRef<HTMLElement>(null);
  const maxProgressRef = useRef(0);
  const copySettledRef = useRef(false);
  const [copyIn, setCopyIn] = useState(false);
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const staticLayout = window.matchMedia('(max-width: 860px)');

    const showFinished = () => {
      copySettledRef.current = true;
      setCopyIn(true);
    };

    if (reduceMotion.matches || staticLayout.matches) {
      showFinished();
      return;
    }

    let raf = 0;

    const progressOf = () => {
      const total = section.offsetHeight - window.innerHeight;
      if (total <= 0) return 1;
      return clamp(-section.getBoundingClientRect().top / total, 0, 1);
    };

    const update = () => {
      raf = 0;
      const next = progressOf();
      maxProgressRef.current = Math.max(maxProgressRef.current, next);

      if (!copySettledRef.current && maxProgressRef.current >= FILM_FORMING) {
        copySettledRef.current = true;
        setCopyIn(true);
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
  }, []);

  return (
    <section
      ref={sectionRef}
      className={styles.sneakChapter}
      aria-labelledby="hackhive-sneak-heading"
    >
      <div className={styles.sneakSticky}>
        <p className={styles.sneakIndex}>
          <span>03</span>
          <span className={styles.sneakIndexRule} aria-hidden="true" />
          <span>HackHive</span>
        </p>

        <div className={styles.sneakStage}>
          <HackHiveStripCanvas sectionRef={sectionRef} clips={hackhiveSneakPeekClips} />
        </div>

        <div className={styles.sneakFooter}>
          <div className={styles.sneakCopy}>
            <h2 id="hackhive-sneak-heading" className={styles.sneakTitle}>
              HackHive
            </h2>
            <p
              className={`${styles.hackhiveFlyIn} ${copyIn ? styles.hackhiveFlyInOn : ''}`}
              style={{ ['--fly-delay' as string]: '60ms' }}
            >
              Ontario Tech’s very own hackathon, the largest in the Durham
              Region. A weekend to build with people from here and far beyond.
            </p>
            <Link
              href="/hackhive"
              className={`${styles.hackhiveCtaFly} ${copyIn ? styles.hackhiveCtaFlyOn : ''}`}
              style={{
                color: '#111',
                ['--fly-delay' as string]: '180ms',
              }}
            >
              Learn more <span aria-hidden="true">›</span>
            </Link>
          </div>

          <dl
            className={`${styles.hackhiveStats} ${copyIn ? styles.hackhiveStatsOn : ''}`}
          >
            <div className={styles.hackhiveStat} style={{ ['--pixel-delay' as string]: '0ms' }}>
              <dt className={styles.hackhiveStatLabel}>Attendees · 2025</dt>
              <dd className={styles.hackhiveStatValue}>300+</dd>
            </div>
            <div className={styles.hackhiveStat} style={{ ['--pixel-delay' as string]: '120ms' }}>
              <dt className={styles.hackhiveStatLabel}>Applicants</dt>
              <dd className={styles.hackhiveStatValue}>500+</dd>
            </div>
            <div
              className={`${styles.hackhiveStat} ${styles.hackhiveStatWide}`}
              style={{ ['--pixel-delay' as string]: '240ms' }}
            >
              <dt className={styles.hackhiveStatLabel}>Reach</dt>
              <dd className={styles.hackhiveStatReach}>
                Applicants from all across the globe
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}
