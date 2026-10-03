'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { CLUB_EMAIL } from '@/data/socials';
import styles from './EmailCopyEnhancer.module.css';

type PopupState = 'hidden' | 'tooltip' | 'copied';

export default function EmailCopyEnhancer() {
  const [popupState, setPopupState] = useState<PopupState>('hidden');
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const emailLinkRef = useRef<HTMLAnchorElement | null>(null);
  const popupStateRef = useRef<PopupState>('hidden');

  popupStateRef.current = popupState;

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const updatePosition = useCallback(() => {
    if (emailLinkRef.current) {
      const rect = emailLinkRef.current.getBoundingClientRect();
      setPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 8,
      });
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    let observer: MutationObserver | null = null;
    let cleanupFn: (() => void) | null = null;

    const setupEnhancer = (emailLink: HTMLAnchorElement) => {
      emailLinkRef.current = emailLink;

      const handleClick = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        cleanup();
        
        (async () => {
          try {
            if (!navigator.clipboard) throw new Error('No clipboard');
            await navigator.clipboard.writeText(CLUB_EMAIL);
            
            updatePosition();
            setPopupState('copied');

            timerRef.current = setTimeout(() => {
              setPopupState('hidden');
            }, 2000);
          } catch {
            window.location.href = `mailto:${CLUB_EMAIL}`;
          }
        })();
      };

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          handleClick(e as unknown as MouseEvent);
        }
      };

      const handleMouseEnter = () => {
        if (popupStateRef.current !== 'copied') {
          updatePosition();
          setPopupState('tooltip');
        }
      };

      const handleMouseLeave = () => {
        if (popupStateRef.current === 'tooltip') {
          setPopupState('hidden');
        }
      };

      const handleFocus = () => {
        if (popupStateRef.current !== 'copied') {
          updatePosition();
          setPopupState('tooltip');
        }
      };

      const handleBlur = () => {
        if (popupStateRef.current === 'tooltip') {
          setPopupState('hidden');
        }
      };

      emailLink.addEventListener('click', handleClick, { capture: true });
      emailLink.addEventListener('keydown', handleKeyDown, { capture: true });
      emailLink.addEventListener('mouseenter', handleMouseEnter, { capture: true });
      emailLink.addEventListener('mouseleave', handleMouseLeave, { capture: true });
      emailLink.addEventListener('focus', handleFocus, { capture: true });
      emailLink.addEventListener('blur', handleBlur, { capture: true });

      emailLink.setAttribute('aria-label', 'Copy email address');

      return () => {
        cleanup();
        emailLink.removeEventListener('click', handleClick, { capture: true });
        emailLink.removeEventListener('keydown', handleKeyDown, { capture: true });
        emailLink.removeEventListener('mouseenter', handleMouseEnter, { capture: true });
        emailLink.removeEventListener('mouseleave', handleMouseLeave, { capture: true });
        emailLink.removeEventListener('focus', handleFocus, { capture: true });
        emailLink.removeEventListener('blur', handleBlur, { capture: true });
      };
    };

    const findAndSetup = (): boolean => {
      const emailLink = document.querySelector(
        `a[href="mailto:${CLUB_EMAIL}"]`
      ) as HTMLAnchorElement | null;

      if (emailLink) {
        cleanupFn = setupEnhancer(emailLink);
        return true;
      }
      return false;
    };

    const timeoutId = setTimeout(() => {
      if (!findAndSetup()) {
        observer = new MutationObserver(() => {
          if (findAndSetup()) {
            observer?.disconnect();
          }
        });
        observer.observe(document.body, { childList: true, subtree: true });
      }
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      observer?.disconnect();
      cleanupFn?.();
    };
  }, [mounted, cleanup, updatePosition]);

  if (!mounted) return null;

  return createPortal(
    <div className={styles.enhancerContainer}>
      {popupState === 'tooltip' && (
        <div
          className={styles.tooltip}
          role="tooltip"
          style={{ left: position.x, top: position.y }}
        >
          Copy our email
        </div>
      )}
      {popupState === 'copied' && (
        <div
          className={styles.copied}
          role="status"
          aria-live="polite"
          style={{ left: position.x, top: position.y }}
        >
          ✓ Copied {CLUB_EMAIL}
        </div>
      )}
      <span className={styles.srOnly} aria-live="polite">
        {popupState === 'copied' ? `Copied ${CLUB_EMAIL}` : ''}
      </span>
    </div>,
    document.body
  );
}
