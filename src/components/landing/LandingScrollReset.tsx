'use client';

import { useEffect } from 'react';

/** Homepage always opens at the top; chapter scroll gates must not fight restore. */
export default function LandingScrollReset() {
  useEffect(() => {
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);

    return () => {
      window.history.scrollRestoration = previous;
    };
  }, []);

  return null;
}
