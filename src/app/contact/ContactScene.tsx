'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import LetterModal from '@/components/contact/LetterModal';
import { CATEGORY_LABELS, type SuggestionCategory } from '@/lib/suggestionValidation';
import { SOCIALS } from '@/data/socials';
import SocialIcon from '@/components/SocialIcon';
import styles from './contact.module.css';

const MeadowScene = dynamic(() => import('@/components/contact/MeadowScene'), {
  ssr: false,
  loading: () => null,
});

function useSupportsWebGL() {
  const [supports, setSupports] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (!gl) {
        setSupports(false);
        return;
      }
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const saveData = (navigator as { connection?: { saveData?: boolean } }).connection?.saveData;
      const deviceMemory = (navigator as { deviceMemory?: number }).deviceMemory;
      const lowMemory = typeof deviceMemory === 'number' && deviceMemory < 4;
      setSupports(!reduceMotion && !saveData && !lowMemory);
    } catch {
      setSupports(false);
    }
  }, []);

  return supports;
}

type ContactSceneProps = {
  fontClasses?: string;
};

export default function ContactScene({ fontClasses }: ContactSceneProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [flagUp, setFlagUp] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastData, setToastData] = useState({ ref: '', category: '', hasEmail: false });
  const [posterVisible, setPosterVisible] = useState(true);
  const [hintVisible, setHintVisible] = useState(false);
  const [hintPos, setHintPos] = useState({ x: 0, y: 0 });
  const [isStacked, setIsStacked] = useState(false);
  const slotRef = useRef<HTMLDivElement>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const supportsWebGL = useSupportsWebGL();

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023.98px)');
    setIsStacked(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsStacked(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const openModal = useCallback(() => setModalOpen(true), []);
  const closeModal = useCallback(() => setModalOpen(false), []);

  const handleFirstFrame = useCallback(() => {
    setPosterVisible(false);
    setHintVisible(true);
  }, []);

  const handleHintPosition = useCallback((x: number, y: number) => {
    setHintPos({ x, y });
  }, []);

  const handleSuccess = useCallback((ref: string, category: SuggestionCategory, hasEmail: boolean) => {
    setFlagUp(true);
    setToastData({ ref, category: CATEGORY_LABELS[category], hasEmail });
    setToastVisible(true);
    closeModal();

    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastVisible(false), 8000);
  }, [closeModal]);

  const handleWriteAnother = useCallback(() => {
    setToastVisible(false);
    setFlagUp(false);
    setTimeout(() => setModalOpen(true), 400);
  }, []);

  return (
    <>
      {/* Scene container - fixed behind everything */}
      <div className={styles.sceneContainer}>
        {/* Gradient fallback */}
        <div className={styles.sceneFallbackGradient} aria-hidden="true" />
        
        {/* Poster fallback */}
        {posterVisible && (
          <Image
            src="/concept-art.jpg"
            alt=""
            fill
            className={styles.sceneFallback}
            priority
            aria-hidden="true"
            style={{ pointerEvents: 'none' }}
          />
        )}

        {/* 3D Scene - positioned above fallbacks */}
        {supportsWebGL !== false && (
          <div className={styles.sceneWrapper}>
            <MeadowScene
              onMailboxClick={openModal}
              flagUp={flagUp}
              onFirstFrame={handleFirstFrame}
              onHintPosition={handleHintPosition}
              stacked={isStacked}
              slotRef={slotRef}
            />
          </div>
        )}
      </div>

      {/* Content wrapper */}
      <div id="contact-ui" className={styles.contentWrapper}>
        <main className={styles.mainContent}>
          <div className={styles.cardsContainer}>
            {/* Find Us Card */}
            <section className={`${styles.glass} ${styles.findUsCard}`} aria-labelledby="findus" data-over-ui>
              <p className={styles.eyebrow}>
                <span>01</span>
                <span className={styles.eyebrowRule} aria-hidden="true" />
                <span>Find us</span>
              </p>
              <h1 id="findus" className={styles.headline}>
                Say hi. Drop an idea.
              </h1>
              <p className={styles.subtext}>
                Questions, collabs or sponsorships: reach the execs on any of these.
              </p>
              <ul className={styles.socials} aria-label="Contact and socials">
                {SOCIALS.map((social) => (
                  <li key={social.id}>
                    <a
                      href={social.href}
                      className={styles.socialLink}
                      target={social.id === 'email' ? undefined : '_blank'}
                      rel={social.id === 'email' ? undefined : 'noreferrer noopener'}
                      aria-label={social.label}
                      title={social.label}
                    >
                      <SocialIcon id={social.id} />
                    </a>
                  </li>
                ))}
              </ul>
            </section>

            {/* Drop Box Card */}
            <section className={`${styles.glass} ${styles.dropboxCard}`} aria-labelledby="dropbox-title" data-over-ui>
              <p className={styles.eyebrow}>
                <span>02</span>
                <span className={styles.eyebrowRule} aria-hidden="true" />
                <span>The drop box</span>
              </p>
              <h2 id="dropbox-title" className={styles.dropboxTitle}>
                Leave us a note.
              </h2>
              <p className={styles.dropboxText}>
                Event ideas, workshop requests, feedback, or just a hello. Anonymous unless you sign it.
              </p>
              <div className={styles.writeButtonRow}>
                <button type="button" className={styles.writeButton} onClick={openModal}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                  </svg>
                  Write a letter
                </button>
                <span className={styles.mailboxHint}>or click the mailbox →</span>
                <span className={styles.mailboxHintMobile}>or tap the mailbox below ↓</span>
              </div>
            </section>
          </div>

          {/* Scene slot for stacked layouts */}
          <div ref={slotRef} className={styles.sceneSlot} aria-hidden="true" />
        </main>
      </div>

      {/* Mailbox tap hint for stacked layouts */}
      {hintVisible && isStacked && !modalOpen && hintPos.x > 0 && (
        <div
          className={`${styles.mailboxHintLabel} ${styles.hintPop}`}
          style={{ left: hintPos.x, top: hintPos.y - 20 }}
          onClick={openModal}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && openModal()}
        >
          <div className={styles.mailboxHintInner}>
            <span className={styles.mailboxHintDot} aria-hidden="true" />
            Tap to leave us a note
          </div>
        </div>
      )}

      {/* Letter Modal */}
      <LetterModal
        isOpen={modalOpen}
        onClose={closeModal}
        onSuccess={handleSuccess}
        mailboxPosition={hintPos.x > 0 ? hintPos : undefined}
        portalClassName={fontClasses}
      />

      {/* Success Toast */}
      <div
        className={styles.toast}
        data-visible={toastVisible}
        data-over-ui
        role="status"
        aria-live="polite"
      >
        <div className={styles.toastInner}>
          <div className={styles.toastIcon}>✓</div>
          <div className={styles.toastContent}>
            <p className={styles.toastTitle}>Your letter is in the box!</p>
            <p className={styles.toastSub}>
              Ref #{toastData.ref} · {toastData.category}
              {toastData.hasEmail && ' · we may reply by email'}
            </p>
          </div>
          <button type="button" className={styles.toastAgain} onClick={handleWriteAnother}>
            Write another
          </button>
        </div>
      </div>
    </>
  );
}
