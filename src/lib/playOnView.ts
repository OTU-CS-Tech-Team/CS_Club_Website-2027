/**
 * Phones don't pin the landing chapters (pinned sections feel stuck on touch), so
 * instead of scrubbing with scroll, play a 0→1 progress over `durationMs` once the
 * element's top is a quarter of the way up the screen. Returns a cleanup function.
 */
export function playOnView(
  el: Element,
  durationMs: number,
  onProgress: (progress: number) => void,
) {
  let raf = 0;
  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      const start = performance.now();
      const step = (now: number) => {
        const progress = Math.min(1, (now - start) / durationMs);
        onProgress(progress);
        if (progress < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    },
    { rootMargin: '0px 0px -25% 0px' },
  );
  observer.observe(el);

  return () => {
    observer.disconnect();
    cancelAnimationFrame(raf);
  };
}
