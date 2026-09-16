'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import HeroCanvas from './HeroCanvas';
import styles from './landing.module.css';

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

/** When framed screens start forming (matches HeroCanvas smoothstep 0.12…). */
const SCREENS_FORMING = 0.18;

const socials = [
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/company/otu-cs-club/',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
        />
      </svg>
    ),
  },
  {
    label: 'Discord',
    href: 'https://discord.com/invite/J9AyT8XADz',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.865-.608 1.25-1.845-.276-3.68-.276-5.487 0-.164-.393-.406-.874-.618-1.25a.077.077 0 0 0-.079-.037 19.736 19.736 0 0 0-4.885 1.515.07.07 0 0 0-.032.028C.533 9.046-.319 13.58.099 18.058a.082.082 0 0 0 .031.056 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.873-1.295 1.226-1.994a.076.076 0 0 0-.042-.106 13.2 13.2 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .078-.01c3.928 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .079.009c.12.099.246.198.373.292a.077.077 0 0 1-.007.128 12.3 12.3 0 0 1-1.873.891.077.077 0 0 0-.041.107c.36.698.772 1.363 1.225 1.993a.076.076 0 0 0 .084.029 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.055c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.029zM8.02 15.331c-1.183 0-2.157-1.086-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.211 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.086-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"
        />
      </svg>
    ),
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/otu.csclub/',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M7.03.084c-1.277.06-2.149.264-2.911.563-.789.308-1.458.72-2.123 1.388C1.331 2.702.921 3.371.616 4.161c-.295.764-.496 1.637-.552 2.914-.056 1.278-.069 1.688-.063 4.947.006 3.259.021 3.667.083 4.947.061 1.277.264 2.148.563 2.911.308.789.72 1.457 1.388 2.123.668.665 1.337 1.074 2.129 1.38.763.295 1.636.496 2.913.552 1.277.056 1.688.069 4.946.063 3.258-.006 3.668-.021 4.948-.082 1.28-.06 2.147-.265 2.91-.563.789-.309 1.458-.72 2.123-1.388.665-.668 1.074-1.338 1.379-2.128.296-.763.497-1.636.552-2.913.056-1.28.069-1.69.063-4.948-.006-3.258-.021-3.667-.082-4.946-.06-1.28-.264-2.149-.563-2.912-.308-.789-.72-1.457-1.388-2.123C21.298 1.33 20.628.921 19.838.617 19.074.321 18.202.12 16.924.064 15.647.009 15.236-.005 11.977.001 8.718.008 8.31.022 7.03.084m.14 21.693c-1.17-.051-1.805-.245-2.229-.408-.56-.216-.96-.477-1.382-.895-.422-.418-.681-.819-.9-1.378-.164-.423-.362-1.058-.417-2.228-.06-1.264-.072-1.644-.079-4.848-.007-3.204.005-3.583.061-4.848.05-1.169.245-1.805.408-2.228.216-.561.476-.96.895-1.382.419-.422.818-.681 1.378-.9.423-.165 1.058-.361 2.227-.417 1.266-.06 1.645-.072 4.848-.079 3.203-.007 3.584.005 4.85.061 1.169.051 1.805.244 2.228.408.56.216.96.475 1.381.895.422.419.682.818.901 1.379.165.422.362 1.056.417 2.226.06 1.266.074 1.645.08 4.848.005 3.203-.006 3.584-.062 4.848-.05 1.17-.245 1.806-.408 2.23-.216.56-.476.96-.895 1.381-.419.421-.818.681-1.378.9-.423.165-1.058.362-2.227.417-1.265.06-1.644.072-4.849.079-3.204.007-3.582-.006-4.848-.061m9.783-16.191a1.44 1.44 0 1 0 1.437-1.442 1.44 1.44 0 0 0-1.437 1.442M5.839 12.012c.006 3.403 2.77 6.156 6.173 6.149 3.402-.006 6.157-2.77 6.15-6.173-.006-3.403-2.771-6.156-6.174-6.15-3.403.007-6.156 2.771-6.149 6.174M8 12.008a4 4 0 1 1 4.008 3.992A4 4 0 0 1 8 12.008"
        />
      </svg>
    ),
  },
];

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const [laterIn, setLaterIn] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      setLaterIn(true);
      return;
    }

    let raf = 0;
    const update = () => {
      raf = 0;
      const total = section.offsetHeight - window.innerHeight;
      const next =
        total <= 0
          ? 1
          : clamp(-section.getBoundingClientRect().top / total, 0, 1);
      // Follow scroll both ways so returning to the top eases the copy back out.
      const show = next >= SCREENS_FORMING;
      setLaterIn((prev) => (prev === show ? prev : show));
    };

    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className={styles.heroChapter}
      data-phase="intro"
      aria-label="Welcome"
    >
      <div className={styles.heroSticky}>
        <div className={styles.heroStage}>
          <HeroCanvas sectionRef={sectionRef} />
          <div className={styles.heroScrim} aria-hidden="true" />
        </div>

        <p className={`${styles.chapterIndex} ${styles.heroChapterIndex}`}>
          <span>01</span>
          <span className={styles.chapterIndexRule} aria-hidden="true" />
          <span>Join</span>
        </p>

        <div className={styles.heroWelcome}>
          <h1 className={styles.heroWelcomeTitle}>
            Welcome to Ontario Tech University&apos;s
            <br />
            Computer Science Club
          </h1>
        </div>

        <div
          className={`${styles.heroLater} ${laterIn ? styles.heroLaterIn : ''}`}
        >
          <p className={styles.heroLaterTitle}>connecting people through technology</p>
          <p
            className={`${styles.heroLaterCaption} ${styles.heroLaterFly} ${laterIn ? styles.heroLaterFlyOn : ''}`}
            style={{ ['--fly-delay' as string]: '0ms' }}
          >
            Home to HackHive, largest hackathon in the Durham Region.
          </p>
          <Link
            href="/careers"
            className={`${styles.heroJoin} ${styles.heroLaterFly} ${laterIn ? styles.heroLaterFlyOn : ''}`}
            style={{ ['--fly-delay' as string]: '140ms' }}
          >
            Join us <span aria-hidden="true">›</span>
          </Link>
          <ul
            className={`${styles.heroSocials} ${styles.heroLaterFly} ${laterIn ? styles.heroLaterFlyOn : ''}`}
            style={{ ['--fly-delay' as string]: '280ms' }}
          >
            {socials.map((social) => (
              <li key={social.label}>
                <a
                  href={social.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={social.label}
                >
                  {social.icon}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
