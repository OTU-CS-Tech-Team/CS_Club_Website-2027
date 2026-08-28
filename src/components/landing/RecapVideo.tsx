'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './landing.module.css';

type RecapVideoProps = {
  src: string;
};

export default function RecapVideo({ src }: RecapVideoProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    const wrap = wrapRef.current;
    const video = videoRef.current;
    if (!wrap || !video) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          void video.play().catch(() => undefined);
        } else {
          video.pause();
        }
      },
      { threshold: 0.4 },
    );

    observer.observe(wrap);
    return () => observer.disconnect();
  }, [missing, src]);

  if (missing) {
    return (
      <div className={styles.recapMissing}>
        <p>
          Recap file not found. Put it at{' '}
          <code>public/social/2025-26-year-recap.mp4</code>.
        </p>
      </div>
    );
  }

  return (
    <div ref={wrapRef} className={styles.recapFrame}>
      <video
        ref={videoRef}
        className={styles.recapVideo}
        src={src}
        controls
        muted
        playsInline
        preload="metadata"
        onError={() => setMissing(true)}
        aria-label="2025–2026 recap"
      />
    </div>
  );
}
