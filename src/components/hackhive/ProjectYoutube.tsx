'use client';

import { useEffect, useRef } from 'react';
import styles from './projectDetail.module.css';

type YTPlayer = {
  playVideo: () => void;
  mute: () => void;
  destroy: () => void;
};

type ProjectYoutubeProps = {
  videoId: string;
  title: string;
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

export default function ProjectYoutube({ videoId, title }: ProjectYoutubeProps) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
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
          autoplay: 1,
          mute: 1,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
        },
        events: {
          onReady: ({ target }: { target: YTPlayer }) => {
            target.mute();
            target.playVideo();
          },
        },
      });
    });

    return () => {
      cancelled = true;
      player?.destroy();
    };
  }, [videoId]);

  return (
    <div className={styles.heroEmbed}>
      <div ref={hostRef} title={title} />
    </div>
  );
}
