'use client';

import { useEffect, useRef, useCallback, useState, useActionState } from 'react';
import Image from 'next/image';
import {
  SUGGESTION_CATEGORIES,
  CATEGORY_LABELS,
  validateSuggestion,
  hasValidationErrors,
  MESSAGE_MAX_LENGTH,
  type SuggestionCategory,
  type SuggestionFieldErrors,
} from '@/lib/suggestionValidation';
import { submitSuggestion, type SuggestionState } from '@/app/contact/actions';
import styles from '@/app/contact/contact.module.css';

type LetterModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (ref: string, category: SuggestionCategory, hasEmail: boolean) => void;
};

export default function LetterModal({ isOpen, onClose, onSuccess }: LetterModalProps) {
  const [state, formAction, pending] = useActionState<SuggestionState, FormData>(submitSuggestion, {
    status: 'idle',
  });

  const formRef = useRef<HTMLFormElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const lastFocusRef = useRef<HTMLElement | null>(null);
  const startedAtRef = useRef<number>(0);

  const [category, setCategory] = useState<SuggestionCategory>('event_idea');
  const [message, setMessage] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [clientErrors, setClientErrors] = useState<SuggestionFieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setCategory('event_idea');
    setMessage('');
    setName('');
    setEmail('');
    setClientErrors({});
    setServerError(null);
  }, []);

  useEffect(() => {
    if (state.status === 'success') {
      onSuccess(state.ref, state.category, !!email.trim());
      resetForm();
    } else if (state.status === 'error') {
      if (state.fieldErrors) {
        setClientErrors(state.fieldErrors);
      }
      if (state.message) {
        setServerError(state.message);
      }
      if (state.values) {
        setCategory((state.values.category as SuggestionCategory) || 'event_idea');
        setMessage(state.values.message);
        setName(state.values.name);
        setEmail(state.values.email);
      }
    }
  }, [state, onSuccess, resetForm, email]);

  useEffect(() => {
    if (isOpen) {
      lastFocusRef.current = document.activeElement as HTMLElement;
      startedAtRef.current = Date.now();
      setServerError(null);
      setClientErrors({});
      document.body.style.overflow = 'hidden';
      setTimeout(() => messageRef.current?.focus({ preventScroll: true }), 60);
    } else {
      document.body.style.overflow = '';
      lastFocusRef.current?.focus?.({ preventScroll: true });
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle visualViewport for mobile keyboards
  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return;
    
    const vv = window.visualViewport;
    if (!vv) return;

    const modal = document.querySelector('[role="dialog"]') as HTMLElement | null;
    if (!modal) return;

    const updateHeight = () => {
      if (window.innerWidth >= 640) {
        modal.style.height = '';
        modal.style.top = '';
        return;
      }
      modal.style.height = `${vv.height}px`;
      modal.style.top = `${vv.offsetTop}px`;
    };

    vv.addEventListener('resize', updateHeight);
    vv.addEventListener('scroll', updateHeight);
    updateHeight();

    return () => {
      vv.removeEventListener('resize', updateHeight);
      vv.removeEventListener('scroll', updateHeight);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !pending) {
        onClose();
      }

      if (e.key === 'Tab' && formRef.current) {
        const focusables = formRef.current.querySelectorAll<HTMLElement>(
          'button:not([tabindex="-1"]), input:not([tabindex="-1"]), textarea'
        );
        const elements = Array.from(focusables).filter((el) => el.offsetParent !== null);
        const first = elements[0];
        const last = elements[elements.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, pending]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !pending) {
      onClose();
    }
  };

  const clearErrorsOnEdit = useCallback(() => {
    if (serverError) setServerError(null);
    if (Object.keys(clientErrors).length > 0) {
      setClientErrors({});
    }
  }, [serverError, clientErrors]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const errors = validateSuggestion({ category, message, name, email });
    if (hasValidationErrors(errors)) {
      e.preventDefault();
      setClientErrors(errors);
      const firstErrorField = errors.message
        ? messageRef.current
        : formRef.current?.querySelector<HTMLInputElement>('[aria-invalid="true"]');
      firstErrorField?.focus();
      return;
    }
    setClientErrors({});
    setServerError(null);
  };

  if (!isOpen) return null;

  const displayErrors =
    state.status === 'error' && state.fieldErrors ? state.fieldErrors : clientErrors;
  const formError = serverError || (state.status === 'error' && state.message ? state.message : null);

  return (
    <div
      className={styles.letterBackdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="letter-title"
      onClick={handleBackdropClick}
    >
      <div className={styles.letterScroller}>
        <form
          ref={formRef}
          action={formAction}
          className={styles.letterForm}
          noValidate
          onSubmit={handleSubmit}
        >
          <div className={styles.letterAirmail} />
          <div className={styles.letterBody}>
            <button
              type="button"
              className={styles.letterClose}
              onClick={onClose}
              disabled={pending}
              aria-label="Close letter"
            >
              ×
            </button>

            <div className={styles.letterHeader}>
              <div>
                <p className={styles.letterMeta}>To: The CS Club Execs · Drop Box No. 2027</p>
                <h3 id="letter-title" className={styles.letterTitle}>
                  Dear CS Club,
                </h3>
              </div>
              <div className={styles.letterStamp}>
                <Image src="/cs-club-mark.png" alt="" width={40} height={40} />
              </div>
            </div>

            <fieldset className={styles.categoryFieldset}>
              <legend className={styles.categoryLegend}>What&apos;s it about?</legend>
              <div className={styles.categoryChips}>
                {SUGGESTION_CATEGORIES.map((cat) => (
                  <label key={cat} className={styles.categoryChip}>
                    <input
                      type="radio"
                      name="category"
                      value={cat}
                      checked={category === cat}
                      onChange={() => {
                        setCategory(cat);
                        clearErrorsOnEdit();
                      }}
                    />
                    <span className={styles.categoryChipLabel}>
                      {CATEGORY_LABELS[cat]}
                    </span>
                  </label>
                ))}
              </div>
              {displayErrors.category && (
                <span className={styles.inputError} role="alert">
                  {displayErrors.category}
                </span>
              )}
            </fieldset>

            <div className={styles.messageGroup}>
              <label className={styles.messageLabel} htmlFor="message">
                Your message <span className={styles.messageRequired}>*</span>
              </label>
              <textarea
                ref={messageRef}
                id="message"
                name="message"
                className={styles.messageTextarea}
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  clearErrorsOnEdit();
                }}
                maxLength={MESSAGE_MAX_LENGTH}
                rows={6}
                aria-describedby="msg-count msg-error"
                aria-invalid={!!displayErrors.message}
                placeholder="It would be so cool if the club ran…"
              />
              <div className={styles.messageFooter}>
                <span id="msg-error" className={styles.messageError} aria-live="polite">
                  {displayErrors.message}
                </span>
                <span id="msg-count" className={styles.messageCount}>
                  {message.length} / {MESSAGE_MAX_LENGTH.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Combined From section */}
            <fieldset className={styles.fromSection}>
              <legend className={styles.fromLegend}>
                From <span className={styles.fromOptional}>(optional)</span>
              </legend>
              <div className={styles.fromFields}>
                <div className={styles.inputGroup}>
                  <label htmlFor="name">Name</label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    className={styles.inputField}
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      clearErrorsOnEdit();
                    }}
                    maxLength={120}
                    autoComplete="name"
                    placeholder="Leave blank to stay anonymous"
                    aria-invalid={!!displayErrors.name}
                  />
                  {displayErrors.name && (
                    <span className={styles.inputError} role="alert">
                      {displayErrors.name}
                    </span>
                  )}
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="email">Email</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    className={styles.inputField}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      clearErrorsOnEdit();
                    }}
                    maxLength={254}
                    autoComplete="email"
                    placeholder="you@ontariotechu.net"
                    aria-invalid={!!displayErrors.email}
                    aria-describedby="email-error"
                  />
                  <span id="email-error" className={styles.inputError} aria-live="polite">
                    {displayErrors.email}
                  </span>
                </div>
              </div>
            </fieldset>

            <div className={styles.honeypot} aria-hidden="true">
              <input name="website" tabIndex={-1} autoComplete="off" />
            </div>

            <input type="hidden" name="startedAt" value={startedAtRef.current} />

            {formError && (
              <p className={styles.formError} role="alert">
                {formError}
              </p>
            )}

            <div className={styles.submitRow}>
              <p className={styles.privacyNote}>
                Only club execs can read the drop box.{' '}
                <span className={styles.anonBadge}>● Anonymous by default</span>
              </p>

              <div className={styles.submitActions}>
                <div className={styles.waxSeal} aria-hidden="true">
                  CS
                </div>
                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={pending}
                  aria-disabled={pending}
                >
                  {pending ? 'Sending…' : 'Seal & send'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
