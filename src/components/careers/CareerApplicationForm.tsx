'use client';

import Link from 'next/link';
import { FormEvent, KeyboardEvent as ReactKeyboardEvent, useEffect, useRef, useState } from 'react';
import type { ClubJob } from '@/types/content';
import styles from './careers.module.css';

const studyYears = ['First year', 'Second year', 'Third year', 'Fourth year', 'Graduate'];

export function YearSelect() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [highlighted, setHighlighted] = useState('');
  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, []);

  function toggle() {
    setOpen((isOpen) => {
      if (!isOpen) setHighlighted(value || studyYears[0]);
      return !isOpen;
    });
  }

  function handleKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>) {
    const currentIndex = studyYears.indexOf(highlighted || value);
    if (event.key === 'Escape') setOpen(false);
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (open && highlighted) {
        setValue(highlighted);
        setOpen(false);
      } else toggle();
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlighted(studyYears[Math.min(currentIndex + 1, studyYears.length - 1)]);
      setOpen(true);
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlighted(studyYears[Math.max(currentIndex - 1, 0)]);
      setOpen(true);
    }
  }

  return (
    <div className={styles.yearSelect} ref={selectRef}>
      <input type="hidden" name="year" value={value} />
      <button
        className={`${styles.yearButton} ${value ? '' : styles.yearPlaceholder}`}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={toggle}
        onKeyDown={handleKeyDown}
      >
        {value || 'Select year'}{' '}
        <span aria-hidden="true">{open ? '⌃' : '⌄'}</span>
      </button>
      {open ? (
        <div className={styles.yearOptions} role="listbox" aria-label="Year of study">
          {studyYears.map((year) => (
            <button
              className={`${styles.yearOption} ${value === year ? styles.yearSelected : ''} ${
                highlighted === year ? styles.yearHighlighted : ''
              }`}
              key={year}
              type="button"
              role="option"
              aria-selected={value === year}
              onMouseEnter={() => setHighlighted(year)}
              onFocus={() => setHighlighted(year)}
              onClick={() => {
                setValue(year);
                setHighlighted(year);
                setOpen(false);
              }}
            >
              {year}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}


export default function CareerApplicationForm({ job }: { job: ClubJob }) {
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!submitted) return;
    window.scrollTo(0, 0);
  }, [submitted]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resumeName, setResumeName] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const resumeRef = useRef<HTMLInputElement>(null);

  function chooseResume(file: File | undefined) {
    if (!file) return;
    const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (extension !== 'pdf') {
      setError('Upload a PDF resume.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Resume must be 5 MB or smaller.');
      return;
    }
    const transfer = new DataTransfer();
    transfer.items.add(file);
    if (resumeRef.current) resumeRef.current.files = transfer.files;
    setResumeName(file.name);
    setError('');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const formData = new FormData(event.currentTarget);
    const requiredFields: Array<[string, string]> = [
      ['firstName', 'your first name'],
      ['lastName', 'your last name'],
      ['email', 'your Ontario Tech email'],
      ['studentId', 'your student ID'],
      ['year', 'your year of study'],
      ['program', 'your program of study'],
    ];
    const missing = requiredFields.find(([name]) => !String(formData.get(name) ?? '').trim());
    if (missing) {
      setError(`Please enter ${missing[1]}.`);
      return;
    }
    if (!resumeRef.current?.files?.[0]) {
      setError('Please upload your resume.');
      return;
    }
    const unanswered = (job.questions ?? []).find((question) => (
      question.required && !String(formData.get(`question:${question.id}`) ?? '').trim()
    ));
    if (unanswered) {
      setError(`Please answer "${unanswered.prompt}".`);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/career-applications', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        setError(result?.error ?? 'Something went wrong. Please try again.');
        return;
      }
      setSubmitted(true);
    } catch {
      setError('We could not reach the application server. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={submitted ? `${styles.applyPage} ${styles.applyPageDone}` : styles.applyPage}>
      <section className={styles.applyShell}>
        <Link href={`/careers/${job.id}`} className={styles.backLink}>
          <span aria-hidden="true">←</span> Back to role
        </Link>

        {submitted ? (
          <div className={styles.success}>
            <h3>Thanks for your interest.</h3>
            <p>Thanks for your interest in this role. If there&apos;s a match, someone from the hiring team will be in touch.</p>
          </div>
        ) : (
          <>
            <p className={styles.applyEyebrow}>{job.category}</p>
            <h1 className={styles.applyTitle}>{job.title}</h1>
            <div className={styles.applyMeta}>
              {job.commitment ? <span>{job.commitment}</span> : null}
              {job.location ? <span>{job.location}</span> : null}
              <span>
                {job.closes_at
                  ? `Closes ${new Intl.DateTimeFormat('en-CA', { dateStyle: 'medium', timeZone: 'America/Toronto' }).format(new Date(job.closes_at))}`
                  : 'Open until filled'}
              </span>
            </div>
            <form onSubmit={handleSubmit} noValidate>
              <input type="hidden" name="jobId" value={job.id} />
              <div className={styles.formGrid}>
                <label>
                  First name
                  <input name="firstName" autoComplete="given-name" aria-required="true" />
                </label>
                <label>
                  Last name
                  <input name="lastName" autoComplete="family-name" aria-required="true" />
                </label>
                <label className={styles.fullWidth}>
                  Ontario Tech email
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    placeholder="first.last@ontariotechu.net"
                    pattern="^[^\s@]+@ontariotechu\.net$"
                    title="Use your @ontariotechu.net email address."
                    aria-required="true"
                  />
                </label>
                <label>
                  Student ID
                  <input
                    name="studentId"
                    inputMode="numeric"
                    placeholder="100123456"
                    pattern="^1\d{8}$"
                    title="Enter your 9-digit student ID beginning with 1."
                    aria-required="true"
                  />
                </label>
                <label>
                  Year of study
                  <YearSelect />
                </label>
                <label className={styles.fullWidth}>
                  Program of study
                  <input name="program" placeholder="e.g. Computer Science" aria-required="true" />
                </label>
                <div className={`${styles.fullWidth} ${styles.resumeField}`}>
                  Resume
                  <button
                    className={`${styles.dropZone} ${dragOver ? styles.dropZoneActive : ''}`}
                    type="button"
                    onClick={() => resumeRef.current?.click()}
                    onDragOver={(event) => {
                      event.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(event) => {
                      event.preventDefault();
                      setDragOver(false);
                      chooseResume(event.dataTransfer.files[0]);
                    }}
                  >
                    {resumeName || 'Drop your resume here, or click to upload'}
                    <span>PDF only, up to 5 MB</span>
                  </button>
                  <input
                    ref={resumeRef}
                    className={styles.srOnly}
                    type="file"
                    name="resume"
                    accept=".pdf,application/pdf"
                    aria-label="Resume"
                    onChange={(event) => chooseResume(event.target.files?.[0])}
                  />
                </div>
                {(job.questions ?? []).map((question) => (
                  <label className={`${styles.fullWidth} ${styles.questionField}`} key={question.id}>
                    <span>
                      {question.prompt}
                      {question.required ? null : <span className={styles.optionalHint}>Optional</span>}
                    </span>
                    <textarea name={`question:${question.id}`} rows={4} maxLength={2000} aria-required={question.required} />
                  </label>
                ))}
                <label className={styles.fullWidth}>
                  Got ideas for us?
                  <textarea
                    name="ideas"
                    rows={4}
                    maxLength={2000}
                    placeholder="Tell us what you would love to see from the club..."
                  />
                </label>
              </div>
              {error ? (
                <p className={styles.formError} role="alert">
                  {error}
                </p>
              ) : null}
              <button className={styles.submit} type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Sending application...' : 'Submit application'}{' '}
                <span aria-hidden="true">→</span>
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
