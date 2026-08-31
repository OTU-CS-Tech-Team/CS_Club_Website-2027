'use client';

import { useEffect, useRef } from 'react';
import styles from './landing.module.css';

type YTPlayer = {
  playVideo: () => void;
  pauseVideo: () => void;
  mute: () => void;
  destroy: () => void;
};

type RecapVideoProps = {
  videoId: string;
};

function loadYouTubeApi(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.resolve();
  }

  const win = window as Window & {
    YT?: { Player: new (el: HTMLElement, opts: unknown) => YTPlayer };
    onYouTubeIframeAPIReady?: () => void;
  };

  if (win.YT?.Player) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const previous = win.onYouTubeIframeAPIReady;
    win.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve();
    };

    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(script);
    }
  });
}

export default function RecapVideo({ videoId }: RecapVideoProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let observer: IntersectionObserver | undefined;
    let player: YTPlayer | undefined;

    void loadYouTubeApi().then(() => {
      if (cancelled || !hostRef.current) {
        return;
      }

      const YT = (window as Window & {
        YT?: { Player: new (el: HTMLElement, opts: unknown) => YTPlayer };
      }).YT;
      if (!YT) {
        return;
      }

      player = new YT.Player(hostRef.current, {
        videoId,
        width: '100%',
        height: '100%',
        playerVars: {
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          mute: 1,
        },
        events: {
          onReady: ({ target }: { target: YTPlayer }) => {
            target.mute();
            if (!wrapRef.current) {
              return;
            }
            observer = new IntersectionObserver(
              ([entry]) => {
                if (entry.isIntersecting) {
                  target.playVideo();
                } else {
                  target.pauseVideo();
                }
              },
              { threshold: 0.4 },
            );
            observer.observe(wrapRef.current);
          },
        },
      });
    });

    return () => {
      cancelled = true;
      observer?.disconnect();
      player?.destroy();
    };
  }, [videoId]);

  return (
    <div ref={wrapRef} className={styles.recapFrame}>
      <div className={styles.recapEmbed}>
        <div ref={hostRef} title="2025–2026 recap" />
      </div>
    </div>
  );
}
