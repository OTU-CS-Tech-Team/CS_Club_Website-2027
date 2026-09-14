'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { hackhiveSneakPeekClips } from '@/data/landing';
import HackHiveStripCanvas from './HackHiveStripCanvas';

export default function HackHiveSneakPeek() {
  const sectionRef = useRef<HTMLElement>(null);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduceMotion(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  return (
    <section
      ref={sectionRef}
      className={`bg-black text-zinc-100 ${reduceMotion ? 'h-dvh' : 'h-[270vh]'}`}
      aria-labelledby="hackhive-sneak-heading"
    >
      <div className="sticky top-0 flex h-dvh flex-col overflow-hidden px-[clamp(1.25rem,5vw,4rem)] pb-6 pt-5">
        <p className="mb-3 flex items-center gap-3 text-[0.72rem] font-medium uppercase tracking-[0.16em] text-zinc-100/70">
          <span>03</span>
          <span className="block h-px w-9 bg-current opacity-55" aria-hidden="true" />
          <span>HackHive</span>
        </p>

        <div className="relative min-h-0 flex-[1.9]">
          {reduceMotion ? (
            <div className="grid h-full grid-cols-4 gap-2 sm:gap-3">
              {hackhiveSneakPeekClips.slice(0, 4).map((clip) => (
                <div
                  key={clip.id}
                  className="relative overflow-hidden rounded-sm bg-zinc-950 ring-1 ring-zinc-800"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={clip.src}
                    alt=""
                    className="h-full w-full object-cover opacity-90 saturate-50"
                  />
                </div>
              ))}
            </div>
          ) : (
            <HackHiveStripCanvas sectionRef={sectionRef} clips={hackhiveSneakPeekClips} />
          )}
        </div>

        <div className="flex shrink-0 flex-col items-start pt-5">
          <h2
            id="hackhive-sneak-heading"
            className="m-0 max-w-[16ch] text-[clamp(1.7rem,3.4vw,2.75rem)] font-medium leading-[1.15] tracking-[-0.04em]"
          >
            HackHive
          </h2>
          <p className="mb-5 mt-3 max-w-md text-[0.92rem] leading-relaxed text-zinc-100/70">
            Ontario Tech’s hackathon — a weekend to build with people across the
            Durham Region.
          </p>
          <Link
            href="#"
            className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-[1.05rem] py-[0.72rem] text-[0.82rem] font-semibold tracking-[0.01em] no-underline hover:opacity-90"
            style={{ color: '#111' }}
          >
            Learn more <span aria-hidden="true">›</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
