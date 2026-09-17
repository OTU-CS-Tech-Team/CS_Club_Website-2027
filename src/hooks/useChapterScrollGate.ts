'use client';

import { useEffect, type RefObject } from 'react';

const HOLD_MS = 850;
/** Matches the breakpoint where chapters 2–4 switch to static (non-sticky) layouts. */
const STATIC_LAYOUT_MQ = '(max-width: 860px)';

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function scrollYForProgress(section: HTMLElement, progress: number) {
  const total = Math.max(0, section.offsetHeight - window.innerHeight);
  const top = section.getBoundingClientRect().top + window.scrollY;
  return top + clamp(progress, 0, 1) * total;
}

/**
 * Caps forward scroll at `completeAt` chapter progress, holds there briefly so
 * the transition can finish on screen, then releases into the next chapter.
 * No-ops on reduced-motion, narrow/static layouts, or chapters without scroll runway.
 *
 * Only arms when the user crosses into `completeAt` during this session — never
 * on mount/restore/resize if they're already past that point.
 */
export function useChapterScrollGate(
  sectionRef: RefObject<HTMLElement | null>,
  completeAt: number,
) {
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const staticLayout = window.matchMedia(STATIC_LAYOUT_MQ);

    let released = false;
    let holding = false;
    let holdUntil = 0;
    let holdY = 0;
    let attached = false;
    /** Last seen progress — used to detect a forward crossing into completeAt. */
    let prevProgress = 0;
    let primed = false;

    const progressOf = () => {
      const total = section.offsetHeight - window.innerHeight;
      if (total <= 0) return 1;
      return clamp(-section.getBoundingClientRect().top / total, 0, 1);
    };

    const hasScrollRunway = () => section.offsetHeight - window.innerHeight > 8;

    const shouldGate = () =>
      !reduceMotion.matches && !staticLayout.matches && hasScrollRunway();

    const lock = () => {
      if (Math.abs(window.scrollY - holdY) > 0.5) {
        window.scrollTo(0, holdY);
      }
    };

    const startHold = () => {
      if (holding || released) return;
      holding = true;
      holdY = scrollYForProgress(section, completeAt);
      holdUntil = performance.now() + HOLD_MS;
      lock();
    };

    const primeFromCurrentPosition = () => {
      const p = progressOf();
      prevProgress = p;
      primed = true;
      // Already past this chapter's finish line (restore / deep link / resize) —
      // treat the gate as done so we never yank scroll backward.
      if (p >= completeAt) {
        released = true;
        holding = false;
      } else {
        released = false;
        holding = false;
      }
    };

    const onScroll = () => {
      if (!shouldGate()) return;

      if (!primed) {
        primeFromCurrentPosition();
        return;
      }

      if (released) return;

      if (holding) {
        if (performance.now() >= holdUntil) {
          released = true;
          holding = false;
          return;
        }
        lock();
        return;
      }

      const p = progressOf();
      // Only hold when crossing the finish line forward, not when landing past it.
      if (prevProgress < completeAt && p >= completeAt) {
        startHold();
      }
      prevProgress = p;
    };

    const freezePointer = (event: Event) => {
      if (!holding || released || performance.now() >= holdUntil) return;
      event.preventDefault();
      lock();
    };

    const freezeKeys = (event: KeyboardEvent) => {
      if (!holding || released || performance.now() >= holdUntil) return;
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
      lock();
    };

    const attach = () => {
      if (attached) return;
      attached = true;
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('wheel', freezePointer, { passive: false });
      window.addEventListener('touchmove', freezePointer, { passive: false });
      window.addEventListener('keydown', freezeKeys);
    };

    const detach = () => {
      if (!attached) return;
      attached = false;
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('wheel', freezePointer);
      window.removeEventListener('touchmove', freezePointer);
      window.removeEventListener('keydown', freezeKeys);
    };

    const syncMode = () => {
      if (shouldGate()) {
        const wasAttached = attached;
        attach();
        // First attach or re-attach after a breakpoint flip: sample position,
        // never force a hold from a restored mid-page scroll.
        if (!wasAttached || !primed) {
          primeFromCurrentPosition();
        }
        return;
      }

      holding = false;
      primed = false;
      detach();
    };

    syncMode();
    reduceMotion.addEventListener('change', syncMode);
    staticLayout.addEventListener('change', syncMode);
    window.addEventListener('resize', syncMode);

    return () => {
      detach();
      reduceMotion.removeEventListener('change', syncMode);
      staticLayout.removeEventListener('change', syncMode);
      window.removeEventListener('resize', syncMode);
    };
  }, [sectionRef, completeAt]);
}
