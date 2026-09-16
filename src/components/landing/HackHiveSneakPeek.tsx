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
/** Scroll progress where the film strip is fully assembled (matches canvas). */
const FILM_ASSEMBLED = 0.88;

export default function HackHiveSneakPeek() {
  const sectionRef = useRef<HTMLElement>(null);
  const holdTriggeredRef = useRef(false);
  const holdUntilRef = useRef(0);
  const holdScrollYRef = useRef(0);
  const maxProgressRef = useRef(0);
  const copySettledRef = useRef(false);
  const [copyIn, setCopyIn] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      copySettledRef.current = true;
      setCopyIn(true);
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

      if (
        !holdTriggeredRef.current &&
        next >= FILM_ASSEMBLED &&
        next < 0.98
      ) {
        holdTriggeredRef.current = true;
        holdScrollYRef.current = window.scrollY;
        holdUntilRef.current = performance.now() + 1000;
      }
    };

    const onScroll = () => {
      if (performance.now() < holdUntilRef.current) {
        if (Math.abs(window.scrollY - holdScrollYRef.current) > 0.5) {
          window.scrollTo(0, holdScrollYRef.current);
        }
        return;
      }
      if (raf) return;
      raf = window.requestAnimationFrame(update);
    };

    const freezeScroll = (event: Event) => {
      if (performance.now() >= holdUntilRef.current) return;
      event.preventDefault();
      if (Math.abs(window.scrollY - holdScrollYRef.current) > 0.5) {
        window.scrollTo(0, holdScrollYRef.current);
      }
    };

    const freezeKeys = (event: KeyboardEvent) => {
      if (performance.now() >= holdUntilRef.current) return;
      const keys = [
        'ArrowDown',
        'ArrowUp',
        'PageDown',
        'PageUp',
        ' ',
        'Spacebar',
        'Home',
        'End',
      ];
      if (!keys.includes(event.key)) return;
      event.preventDefault();
      if (Math.abs(window.scrollY - holdScrollYRef.current) > 0.5) {
        window.scrollTo(0, holdScrollYRef.current);
      }
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    window.addEventListener('wheel', freezeScroll, { passive: false });
    window.addEventListener('touchmove', freezeScroll, { passive: false });
    window.addEventListener('keydown', freezeKeys);
    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      window.removeEventListener('wheel', freezeScroll);
      window.removeEventListener('touchmove', freezeScroll);
      window.removeEventListener('keydown', freezeKeys);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="h-[200vh] bg-black text-zinc-100 motion-reduce:h-dvh"
      style={{ background: '#000', color: '#f4f4f5' }}
      aria-labelledby="hackhive-sneak-heading"
    >
      <div className="sticky top-0 flex h-dvh flex-col overflow-hidden px-[clamp(1.25rem,5vw,4rem)] pb-6 pt-5">
        <p className="mb-3 flex items-center gap-3 text-[0.72rem] font-medium uppercase tracking-[0.16em] text-zinc-100/70">
          <span>03</span>
          <span className="block h-px w-9 bg-current opacity-55" aria-hidden="true" />
          <span>HackHive</span>
        </p>

        <div
          className="relative min-h-[36vh] w-full flex-[1.9]"
          style={{ minHeight: '36vh' }}
        >
          <HackHiveStripCanvas sectionRef={sectionRef} clips={hackhiveSneakPeekClips} />
        </div>

        <div className="flex shrink-0 flex-col gap-8 pt-5 sm:flex-row sm:items-end sm:justify-between sm:gap-10">
          <div className="flex max-w-md flex-col items-start">
            <h2
              id="hackhive-sneak-heading"
              className="m-0 max-w-[16ch] text-[clamp(1.7rem,3.4vw,2.75rem)] font-medium leading-[1.15] tracking-[-0.04em]"
            >
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
              href="#"
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
