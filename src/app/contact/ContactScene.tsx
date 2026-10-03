'use client';

import { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { JetBrains_Mono } from 'next/font/google';
import LetterModal from '@/components/contact/LetterModal';
import { CATEGORY_LABELS, type SuggestionCategory } from '@/lib/suggestionValidation';
import styles from './contact.module.css';

const MeadowScene = dynamic(() => import('@/components/contact/MeadowScene'), {
  ssr: false,
  loading: () => null,
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
});

function useSupportsWebGL() {
  const [supports, setSupports] = useState<boolean | null>(null);

  useEffect(() => {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    const saveData = (navigator as { connection?: { saveData?: boolean } }).connection?.saveData;
    const lowEnd = saveData || navigator.hardwareConcurrency <= 4;
    setSupports(!!gl && !lowEnd);
  }, []);

  return supports;
}

export default function ContactScene() {
  const [modalOpen, setModalOpen] = useState(false);
  const [flagUp, setFlagUp] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastData, setToastData] = useState({ ref: '', category: '' });
  const [sceneVisible, setSceneVisible] = useState(false);

  const supportsWebGL = useSupportsWebGL();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setSceneVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' }
    );

    const target = document.getElementById('dropbox');
    if (target) observer.observe(target);

    return () => observer.disconnect();
  }, []);

  const openModal = useCallback(() => setModalOpen(true), []);
  const closeModal = useCallback(() => setModalOpen(false), []);

  const handleSuccess = useCallback((ref: string, category: SuggestionCategory) => {
    setFlagUp(true);
    setToastData({ ref, category: CATEGORY_LABELS[category] });
    setToastVisible(true);

    const timeout = setTimeout(() => setToastVisible(false), 8000);
    return () => clearTimeout(timeout);
  }, []);

  const handleWriteAnother = useCallback(() => {
    setToastVisible(false);
    setFlagUp(false);
    setTimeout(() => setModalOpen(true), 400);
  }, []);

  return (
    <>
      <section id="dropbox" className={styles.sceneSection} aria-labelledby="dropbox-title">
        <div className={styles.sceneWrap}>
          <Image
            src="/concept-art.png"
            alt="Illustration: the CS Club mailbox in a sunny meadow"
            fill
            className={styles.sceneFallback}
            priority={false}
            style={{ objectFit: 'cover' }}
          />

          {supportsWebGL && sceneVisible && (
            <MeadowScene onMailboxClick={openModal} flagUp={flagUp} />
          )}

          <div className={styles.sceneOverlay}>
            <div className={styles.sceneOverlayInner}>
              <div className={styles.sceneCard}>
                <p className={`${styles.eyebrow} ${mono.className}`}>
                  <span>02</span>
                  <span className={styles.eyebrowRule} aria-hidden="true" />
                  <span>The drop box</span>
                </p>
                <h2 id="dropbox-title" className={styles.sceneCardTitle}>
                  Leave us a note.
                </h2>
                <p className={styles.sceneCardText}>
                  Event ideas, workshop requests, feedback, or just a hello. Anonymous unless you
                  sign it.
                </p>
                <button type="button" className={styles.writeButton} onClick={openModal}>
                  ✉ Write a letter
                </button>
              </div>
            </div>
          </div>

          <p className={`${styles.sceneHint} ${mono.className}`}>tap the mailbox ✉</p>
        </div>
      </section>

      <LetterModal isOpen={modalOpen} onClose={closeModal} onSuccess={handleSuccess} />

      <div
        className={styles.toast}
        data-visible={toastVisible}
        role="status"
        aria-live="polite"
      >
        <div className={styles.toastInner}>
          <div className={styles.toastIcon}>✓</div>
          <div className={styles.toastContent}>
            <p className={styles.toastTitle}>Your letter is in the box!</p>
            <p className={styles.toastSub}>
              Ref #{toastData.ref} · {toastData.category}
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
