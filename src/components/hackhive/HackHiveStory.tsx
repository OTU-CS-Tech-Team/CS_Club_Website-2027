"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import styles from './hackhiveStory.module.css';

const heroWords = [
  { word: 'Real.', color: '#d45d7d' },
  { word: 'Bold.', color: '#6a3df5' },
  { word: 'Useful.', color: '#2f7d6d' },
  { word: 'Meaningful.', color: '#c45c26' },
  { word: 'Lasting.', color: '#3d5a80' },
  { word: 'Together.', color: '#7a4e8a' },
  { word: 'Creative.', color: '#b23a6a' },
  { word: 'Curious.', color: '#1f6f8b' },
  { word: 'Ambitious.', color: '#8a4b08' },
  { word: 'Possible.', color: '#3d4db7' },
  { word: 'Impactful.', color: '#9b3d4a' },
  { word: 'Brilliant.', color: '#5b3a8c' },
];
const statTargets = [250, 550, 24];
const SHOW_TESTIMONIALS = false;
const SHOW_SPONSORS = false;

const orbitImages = [
  { src: '/hackhive/orbit/team-portrait.png', className: styles.orbitOne },
  { src: '/hackhive/orbit/immersive-demo.png', className: styles.orbitTwo },
  { src: '/hackhive/orbit/mic-moment.webp', className: styles.orbitThree },
  { src: '/hackhive/orbit/sponsor-table.png', className: styles.orbitFour },
  { src: '/hackhive/filmstrip/hallway.jpg', className: styles.orbitFive },
  { src: '/hackhive/orbit/builders-at-work.png', className: styles.orbitSix },
  { src: '/hackhive/filmstrip/lecture-row.jpg', className: styles.orbitSeven },
  { src: '/hackhive/orbit/crowd-overhead.webp', className: styles.orbitEight },
  { src: '/hackhive/filmstrip/study-pair.jpg', className: styles.orbitNine },
  { src: '/hackhive/filmstrip/checkin-desk.jpg', className: styles.orbitTen },
  { src: '/hackhive/filmstrip/noodles.jpg', className: styles.orbitEleven },
  { src: '/hackhive/filmstrip/pastries.jpg', className: styles.orbitTwelve },
];

const galleryImages = [
  {
    src: '/hackhive/gallery/checkin-conversation.webp',
    alt: 'A HackHive organizer welcoming an attendee at check-in',
    className: styles.galleryLarge,
    label: 'The doors open',
  },
  {
    src: '/hackhive/gallery/event-host.webp',
    alt: 'A HackHive organizer speaking during the event',
    className: styles.galleryTall,
    label: 'Built in a weekend',
  },
  {
    src: '/hackhive/filmstrip/pitch-mic.jpg',
    alt: 'A HackHive participant presenting their project',
    className: styles.galleryWide,
    label: 'Ideas, out loud',
  },
  {
    src: '/hackhive/gallery/project-demo.webp',
    alt: 'HackHive participants sharing their project at a demo table',
    className: styles.gallerySmall,
    label: 'A room full of possibility',
  },
];

const testimonials = [
  {
    names: 'Samir & Samad',
    role: 'Vice Presidents, OTU CS Club',
    quote:
      'Attending HackHive means being part of a space where curiosity, creativity, and community come together. It is a chance to challenge yourself, learn new skills, meet people who inspire you, and grow through both the successes and struggles of building something from scratch. More than just a hackathon, HackHive is an experience that encourages you to step outside your comfort zone, believe in your ideas, and leave with new knowledge, connections, and confidence.',
  },
  {
    names: 'Maryam & Muqit',
    role: 'Co-Presidents, OTU CS Club',
    quote:
      'HackHive has been one of the most rewarding parts of our time with the Computer Science Club. Seeing students come together to build, learn, and challenge themselves has made all the work behind it worthwhile. As Co-Presidents, we are excited to keep growing HackHive into something even bigger, with stronger opportunities, better experiences, and more ways for students to connect. We hope it continues becoming a defining part of the CS Club for years ahead.',
  },
  {
    names: 'Wasay',
    role: 'Co-Founder of HackHive & Former President @ OTU CS Club',
    quote:
      "HackHive isn't just something I built, it's something I actually believe in. I co-founded it in 2023 because I kept meeting insanely talented people at this university who had nowhere to show what they could do. That never sat right with me, so a friend and I decided to build the stage ourselves. Watching it grow into Durham Region's largest hackathon still doesn't feel real some days. But the numbers were never the point, it was always about giving people a real shot. It's the thing I'm proudest of from my time here.",
  },
  {
    names: 'Taha',
    role: 'Co-Founder of HackHive & Former President @ OTU CS Club',
    quote:
      "HackHive has a special place in my heart. I watched it grow from a passion project started by a few friends to something I had the chance to build and grow. I saw it blossom into something that could help build knowledge and give students a chance to experience the kind of hands-on learning that a classroom just can't teach. To find friends and community, and to see up close what the tech industry actually looks like. I know HackHive will continue to grow and inspire others to take charge in their community, and I am excited to see where we go from here.",
  },
];

const sponsors = ['Microsoft', 'Dayforce', 'Brilliant Catalyst', 'Ontario Tech Science Council'];
const DEBUG_ORBIT = false;

export default function HackHiveStory() {
  const [heroWordIndex, setHeroWordIndex] = useState(0);
  const [statValues, setStatValues] = useState(() => statTargets.map(() => 0));
  const [statsActive, setStatsActive] = useState(false);
  const orbitStageRef = useRef<HTMLDivElement>(null);
  const orbitSvgRef = useRef<SVGSVGElement>(null);
  const orbitPathRef = useRef<SVGPathElement>(null);
  const heroContentRef = useRef<HTMLDivElement>(null);
  const orbitItemRefs = useRef<Array<HTMLDivElement | null>>([]);
  const orbitPausedRef = useRef(false);
  const statsRef = useRef<HTMLDListElement>(null);

  useEffect(() => {
    const stats = statsRef.current;
    if (!stats) return;

    let frame = 0;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const reveal = () => {
      setStatsActive(true);
      if (reducedMotion) {
        setStatValues(statTargets);
        return;
      }

      const startedAt = performance.now();
      const duration = 800;
      const countUp = (now: number) => {
        const progress = Math.min((now - startedAt) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 4);
        setStatValues(statTargets.map((target) => Math.round(target * eased)));
        if (progress < 1) frame = requestAnimationFrame(countUp);
      };
      frame = requestAnimationFrame(countUp);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        reveal();
      },
      { threshold: 0.3 },
    );
    observer.observe(stats);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    const stage = orbitStageRef.current;
    const orbitSvg = orbitSvgRef.current;
    const orbitPath = orbitPathRef.current;
    if (!stage || !orbitSvg || !orbitPath) return;

    let frame = 0;
    let globalProgress = 0;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const baseSpeed = reducedMotion ? 0 : 1 / 24;
    let currentSpeed = baseSpeed;
    let lastTime = performance.now();
    let pathLength = 0;
    let pathTop = 0;
    let pathBottom = 1;
    let mobileCards = false;
    let compactCards = false;

    const resize = () => {
      const stageRect = stage.getBoundingClientRect();
      const contentRect = heroContentRef.current?.getBoundingClientRect();
      const width = stageRect.width;
      const height = stageRect.height;
      mobileCards = window.innerWidth <= 620;
      compactCards = window.innerWidth <= 850;
      // Phones: the biggest card on the ring's sides (84px card at ~0.9 depth scale).
      const hoveredCardSize = mobileCards ? 80 : compactCards ? 130 : 174;
      const cardClearance = hoveredCardSize / 2;
      // Phones: the stage is inset 12px from the screen, so -8 keeps cards 4px inside it.
      const sideEdgePadding = mobileCards ? -8 : compactCards ? 10 : 16;
      const topEdgePadding = mobileCards ? 6 : compactCards ? 12 : 16;
      const bottomEdgePadding = mobileCards ? 4 : compactCards ? 8 : 12;
      const sideGap = mobileCards ? 8 : compactCards ? 34 : 48;
      const topGap = mobileCards ? 26 : compactCards ? 42 : 52;
      const bottomGap = mobileCards ? 64 : compactCards ? 84 : 104;
      const contentLeft = contentRect ? contentRect.left - stageRect.left : width * 0.3;
      const contentRight = contentRect ? contentRect.right - stageRect.left : width * 0.7;
      const contentTop = contentRect ? contentRect.top - stageRect.top : height * 0.4;
      const contentBottom = contentRect ? contentRect.bottom - stageRect.top : height * 0.6;
      const safeLeft = contentLeft - sideGap;
      const safeRight = contentRight + sideGap;
      const safeTop = contentTop - topGap;
      const safeBottom = contentBottom + bottomGap;
      const centerX = width / 2;
      const centerY = (contentTop + contentBottom) / 2;
      const angle = (mobileCards ? -5 : compactCards ? -9 : -12) * Math.PI / 180;
      // Phones: a big, nearly round ring that fills the screen, so cards never bunch up.
      let radiusX = width * (mobileCards ? 0.52 : 0.47);
      let radiusY = height * (mobileCards ? 0.4 : compactCards ? 0.33 : 0.35);
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const boundX = Math.sqrt((radiusX * cos) ** 2 + (radiusY * sin) ** 2);
      const boundY = Math.sqrt((radiusX * sin) ** 2 + (radiusY * cos) ** 2);
      const availableX = Math.max(
        1,
        Math.min(centerX, width - centerX) - sideEdgePadding - cardClearance,
      );
      const availableY = Math.max(
        1,
        Math.min(
          centerY - topEdgePadding - cardClearance,
          height - centerY - bottomEdgePadding - cardClearance,
        ),
      );
      if (mobileCards) {
        // Phones: narrow the ring to fit the screen width but keep its height, so the
        // cards stay on screen without bunching together.
        radiusX *= Math.min(1, availableX / boundX);
        radiusY *= Math.min(1, availableY / boundY);
      } else {
        const fitScale = Math.min(1, availableX / boundX, availableY / boundY);
        radiusX *= fitScale;
        radiusY *= fitScale;
      }

      const pathPoints = Array.from({ length: 241 }, (_, index) => {
        const theta = index / 240 * Math.PI * 2;
        const ellipseX = radiusX * Math.cos(theta);
        const ellipseY = radiusY * Math.sin(theta);
        return {
          x: centerX + ellipseX * cos - ellipseY * sin,
          y: centerY + ellipseX * sin + ellipseY * cos,
        };
      });
      pathTop = Math.min(...pathPoints.map((point) => point.y));
      pathBottom = Math.max(...pathPoints.map((point) => point.y));
      const pathData = pathPoints
        .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
        .concat('Z')
        .join(' ');

      orbitSvg.setAttribute('viewBox', `0 0 ${width} ${height}`);
      orbitPath.setAttribute('d', pathData);
      pathLength = orbitPath.getTotalLength();
      let pathIsSafe = true;
      for (let sample = 0; sample <= 500; sample += 1) {
        const point = orbitPath.getPointAtLength(pathLength * sample / 500);
        const cardLeft = point.x - cardClearance;
        const cardRight = point.x + cardClearance;
        const cardTop = point.y - cardClearance;
        const cardBottom = point.y + cardClearance;
        if (
          cardRight > safeLeft && cardLeft < safeRight &&
          cardBottom > safeTop && cardTop < safeBottom
        ) {
          pathIsSafe = false;
          break;
        }
      }
      // On phone widths the hero text fills the stage, so the protected rect spans
      // the full width and contains the orbit centre — no closed path can clear it.
      // Only assert where the constraint is satisfiable (text as a centre column).
      const contentSpansStage = safeLeft <= 0 && safeRight >= width;
      console.assert(
        pathIsSafe || contentSpansStage,
        'HackHive orbit path intersects the protected content rectangle.',
      );
      stage.dataset.orbitSafe = String(pathIsSafe);
      stage.style.setProperty('--orbit-center-x', `${centerX}px`);
      stage.style.setProperty('--orbit-center-y', `${centerY}px`);
      stage.style.setProperty('--exclusion-left', `${contentLeft}px`);
      stage.style.setProperty('--exclusion-top', `${contentTop}px`);
      stage.style.setProperty('--exclusion-width', `${contentRight - contentLeft}px`);
      stage.style.setProperty('--exclusion-height', `${contentBottom - contentTop}px`);
      stage.style.setProperty('--safe-left', `${safeLeft}px`);
      stage.style.setProperty('--safe-top', `${safeTop}px`);
      stage.style.setProperty('--safe-width', `${safeRight - safeLeft}px`);
      stage.style.setProperty('--safe-height', `${safeBottom - safeTop}px`);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(stage);
    if (heroContentRef.current) observer.observe(heroContentRef.current);
    resize();

    const animate = (time: number) => {
      const elapsed = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;
      if (pathLength > 0) {
        const targetSpeed = orbitPausedRef.current ? 0 : baseSpeed;
        currentSpeed += (targetSpeed - currentSpeed) * (1 - Math.exp(-8 * elapsed));
        globalProgress = (globalProgress + currentSpeed * elapsed) % 1;

        orbitItemRefs.current.forEach((item, index) => {
          if (!item) return;
          const phaseOffset = index / orbitImages.length;
          const progress = (globalProgress + phaseOffset) % 1;
          const point = orbitPath.getPointAtLength(progress * pathLength);
          const depth = Math.max(0, Math.min(1, (point.y - pathTop) / Math.max(1, pathBottom - pathTop)));
          const easedDepth = depth * depth * (3 - 2 * depth);
          // Phones: gentler depth range (~2x back to front) keeps the front cards from colliding.
          const scale = mobileCards ? 0.6 + easedDepth * 0.55 : 0.45 + easedDepth * 0.9;
          item.style.transform = `translate3d(${point.x}px, ${point.y}px, 0) translate(-50%, -50%) scale(${scale})`;
          const isActive = item.matches(':hover, :focus-visible');
          item.style.zIndex = isActive ? '10' : String(1 + Math.round(depth * 2));
          item.style.opacity = String(0.86 + depth * 0.14);
        });
      }
      frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  const holdOrbit = (event: { type: string; currentTarget: Element }) => {
    if (event.type === 'focus' && event.currentTarget.matches(':hover')) {
      orbitPausedRef.current = true;
      return;
    }
    orbitPausedRef.current = true;
    setHeroWordIndex((current) => (current + 1) % heroWords.length);
  };

  const resumeOrbit = () => {
    orbitPausedRef.current = false;
  };

  return (
    <div className={styles.page}>
      <section className={styles.hero} aria-labelledby="hackhive-headline">
        <div ref={orbitStageRef} className={styles.orbitStage}>
          <svg ref={orbitSvgRef} className={styles.orbitPathSvg} aria-hidden="true">
            <path
              ref={orbitPathRef}
              className={DEBUG_ORBIT ? styles.debugOrbitPath : styles.orbitPath}
            />
          </svg>
          <div className={styles.orbitTrack}>
          {orbitImages.map((image) => (
            <div
              ref={(item) => { orbitItemRefs.current[orbitImages.indexOf(image)] = item; }}
              className={`${styles.orbitItem} ${image.className}`}
              key={image.src}
              tabIndex={0}
              aria-label="HackHive memory"
              onMouseEnter={holdOrbit}
              onMouseLeave={resumeOrbit}
              onFocus={holdOrbit}
              onBlur={resumeOrbit}
            >
              <div className={styles.orbitItemInner}>
                <Image src={image.src} alt="" fill sizes="(max-width: 700px) 28vw, 180px" />
                {DEBUG_ORBIT && <span className={styles.debugCardBounds} />}
              </div>
            </div>
          ))}
          </div>
        </div>

        <div ref={heroContentRef} className={styles.heroContent}>
          <h1
            id="hackhive-headline"
            aria-label={`Build something ${heroWords[heroWordIndex].word}`}
          >
            <span aria-hidden="true" className={styles.heroPhrase}>Build something</span>
            <span aria-hidden="true" className={styles.wordCycle}>
              {heroWords.map((entry, index) => (
                <span
                  className={`${styles.changingWord} ${index === heroWordIndex ? styles.changingWordActive : ''}`}
                  key={entry.word}
                  style={{ color: entry.color }}
                >
                  {entry.word}
                </span>
              ))}
            </span>
          </h1>
        </div>

        {DEBUG_ORBIT && (
          <div className={styles.debugLayer} aria-hidden="true">
            <div className={styles.debugContent} />
            <div className={styles.debugExclusion} />
            <div className={styles.debugCenter} />
          </div>
        )}

      </section>

      <section className={styles.intro} id="impact" aria-labelledby="impact-title">
        <p className={styles.sectionLabel}>The Hive, by the numbers</p>
        <div className={styles.introGrid}>
          <h2 id="impact-title">A campus idea that grew into Durham&apos;s biggest hackathon.</h2>
          <p>
            It began with a simple belief: talented people should have a place to show what they can do. Every year, that place gets louder, kinder, and more ambitious.
          </p>
        </div>
        <dl ref={statsRef} className={`${styles.stats} ${statsActive ? styles.statsActive : ''}`}>
          <div><dt>Builders</dt><dd><span className={styles.statNumber}>{statValues[0]}</span><span className={styles.statPlus}>+</span></dd></div>
          <div><dt>Applications</dt><dd><span className={styles.statNumber}>{statValues[1]}</span><span className={styles.statPlus}>+</span></dd></div>
          <div><dt>Institutions</dt><dd><span className={styles.statNumber}>{statValues[2]}</span><span className={styles.statPlus}>+</span></dd></div>
          <div className={styles.statStatement}>
            <dt>Durham Region</dt>
            <dd><span>Largest</span> <span>hackathon</span></dd>
          </div>
        </dl>
      </section>

      <section className={styles.gallerySection} aria-labelledby="gallery-title">
        <div className={styles.sectionHeading}>
          <p className={styles.sectionLabel}>Last year, in the room</p>
          <h2 id="gallery-title">The part you had to be there for.</h2>
        </div>
        <div className={styles.gallery}>
          {galleryImages.map((image) => (
            <figure className={`${styles.galleryFigure} ${image.className}`} key={image.src}>
              <Image src={image.src} alt={image.alt} fill sizes="(max-width: 700px) 100vw, 50vw" />
              <figcaption>{image.label}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      {SHOW_TESTIMONIALS && (
        <section className={styles.testimonials} aria-labelledby="voices-title">
          <div className={styles.testimonialHeading}>
            <p className={styles.sectionLabel}>Why it matters</p>
            <h2 id="voices-title">From the people who built the hive.</h2>
          </div>
          <div className={styles.quoteGrid}>
            {testimonials.map((testimonial) => (
              <figure className={styles.quoteCard} key={testimonial.names}>
                <blockquote>{testimonial.quote}</blockquote>
                <figcaption>
                  <strong>{testimonial.names}</strong>
                  <span>{testimonial.role}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {SHOW_SPONSORS && (
        <section className={styles.sponsors} aria-labelledby="sponsors-title">
          <div className={styles.sponsorLead}>
            <p className={styles.sectionLabel}>2025 supporters</p>
            <h2 id="sponsors-title">Made possible with people who back student builders.</h2>
          </div>
          <ul className={styles.sponsorList} aria-label="HackHive 2025 sponsors">
            {sponsors.map((sponsor) => <li key={sponsor}>{sponsor}</li>)}
          </ul>
        </section>
      )}

      <section className={styles.archiveCta} aria-labelledby="archive-title">
        <p className={styles.sectionLabel}>Keep exploring</p>
        <h2 id="archive-title">The ideas live on after the weekend.</h2>
        <p>See what past teams made when they had 48 hours, a blank canvas, and each other.</p>
        <Link href="/hackhive/archive" className={styles.archiveLink}>Explore the project archive <span aria-hidden="true">→</span></Link>
      </section>
    </div>
  );
}
