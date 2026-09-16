'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { hackhiveSneakPeekClips } from '@/data/landing';
import HackHiveStripCanvas from './HackHiveStripCanvas';

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

/** Scroll progress where the film strip is fully assembled (matches canvas). */
const FILM_ASSEMBLED = 0.88;

export default function HackHiveSneakPeek() {
  const sectionRef = useRef<HTMLElement>(null);
  const holdTriggeredRef = useRef(false);
  const holdUntilRef = useRef(0);
  const holdScrollYRef = useRef(0);

  // After the strip comes together, freeze scroll ~1s so the loop can start
  // without skipping straight into chapter 4.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;

    let raf = 0;

    const progressOf = () => {
      const total = section.offsetHeight - window.innerHeight;
      if (total <= 0) return 1;
      return clamp(-section.getBoundingClientRect().top / total, 0, 1);
    };

    const update = () => {
      raf = 0;
      const next = progressOf();

      // Scrolled back above the chapter — allow the hold to fire again.
      if (next < 0.2) {
        holdTriggeredRef.current = false;
        holdUntilRef.current = 0;
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
            <p className="mb-5 mt-3 text-[0.92rem] leading-relaxed text-zinc-100/70">
              Ontario Tech’s very own hackathon, the largest in the Durham
              Region. A weekend to build with people from here and far beyond.
            </p>
            <Link
              href="#"
              className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-[1.05rem] py-[0.72rem] text-[0.82rem] font-semibold tracking-[0.01em] no-underline hover:opacity-90"
              style={{ color: '#111' }}
            >
              Learn more <span aria-hidden="true">›</span>
            </Link>
          </div>

          <dl className="m-0 grid grid-cols-2 gap-x-8 gap-y-5 sm:min-w-[16rem] sm:shrink-0">
            <div>
              <dt className="m-0 text-[0.68rem] font-medium uppercase tracking-[0.14em] text-zinc-100/45">
                Attendees · 2025
              </dt>
              <dd className="m-0 mt-1 text-[clamp(1.55rem,2.8vw,2.1rem)] font-medium tracking-[-0.03em] tabular-nums">
                300+
              </dd>
            </div>
            <div>
              <dt className="m-0 text-[0.68rem] font-medium uppercase tracking-[0.14em] text-zinc-100/45">
                Applicants
              </dt>
              <dd className="m-0 mt-1 text-[clamp(1.55rem,2.8vw,2.1rem)] font-medium tracking-[-0.03em] tabular-nums">
                500+
              </dd>
            </div>
            <div className="col-span-2">
              <dt className="m-0 text-[0.68rem] font-medium uppercase tracking-[0.14em] text-zinc-100/45">
                Reach
              </dt>
              <dd className="m-0 mt-1 max-w-[22ch] text-[0.92rem] leading-snug text-zinc-100/70">
                Applicants from all across the globe
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}
