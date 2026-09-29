'use client';

import { useEffect } from 'react';

/** Homepage opens at the top, except a return to the corkboard. */
export default function LandingScrollReset() {
  useEffect(() => {
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    if (window.location.hash !== '#hackhive-archive') {
      window.scrollTo(0, 0);
    }

    return () => {
      window.history.scrollRestoration = previous;
    };
  }, []);

  return null;
}
