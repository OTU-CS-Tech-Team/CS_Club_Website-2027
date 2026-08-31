'use client';

import { FormEvent, KeyboardEvent as ReactKeyboardEvent, useEffect, useRef, useState } from 'react';
import type { ClubJob } from '@/types/content';

const studyYears = ['First year', 'Second year', 'Third year', 'Fourth year', 'Graduate'];

function YearSelect() {
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

  return <div className="careers-year-select" ref={selectRef}>
    <input type="hidden" name="year" value={value} />
    <button className="careers-year-select-button" type="button" aria-haspopup="listbox" aria-expanded={open} onClick={toggle} onKeyDown={handleKeyDown}>
      {value || 'Select year'} <span aria-hidden="true">⌄</span>
    </button>
    {open && <div className="careers-year-options" role="listbox" aria-label="Year of study">
      {studyYears.map((year) => <button className={`careers-year-option${value === year ? ' is-selected' : ''}${highlighted === year ? ' is-highlighted' : ''}`} key={year} type="button" role="option" aria-selected={value === year} onMouseEnter={() => setHighlighted(year)} onFocus={() => setHighlighted(year)} onClick={() => { setValue(year); setHighlighted(year); setOpen(false); }}>{year}</button>)}
    </div>}
  </div>;
}

export default function CareerApplicationForm({ job }: { job: ClubJob }) {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const formData = new FormData(event.currentTarget);
      const response = await fetch('/api/career-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(formData.entries())),
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

  return <div className="careers-page careers-apply-page"><section className="careers-application-panel">
    {submitted ? <div className="careers-success"><h3>Application received.</h3><p>Thanks for putting yourself forward. The CS Club team will be in touch through your Ontario Tech email.</p></div> : <>
      <div className="careers-application-heading"><div><div className="careers-eyebrow">{job.title}</div><p>{job.description}</p></div></div>
      <form onSubmit={handleSubmit}>
        <input type="hidden" name="jobId" value={job.id} />
        <div className="careers-form-grid">
          <label>First name<input name="firstName" autoComplete="given-name" required /></label><label>Last name<input name="lastName" autoComplete="family-name" required /></label>
          <label className="careers-full-width">Ontario Tech email<input type="email" name="email" autoComplete="email" placeholder="first.last@ontariotechu.net" pattern="^[^\s@]+@ontariotechu\.net$" title="Use your @ontariotechu.net email address." required /></label>
          <label>Student ID<input name="studentId" inputMode="numeric" placeholder="100123456" pattern="^1\d{8}$" title="Enter your 9-digit student ID beginning with 1." required /></label><label>Year of study<YearSelect /></label>
          <label className="careers-full-width">Program of study<input name="program" placeholder="e.g. Computer Science" required /></label><label className="careers-full-width">Got ideas for us?<textarea name="ideas" rows={4} maxLength={2000} placeholder="Tell us what you would love to see from the club..." /></label>
        </div>
        {error && <p className="careers-form-error" role="alert">{error}</p>}<button className="careers-primary-button careers-submit-button" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Sending application...' : 'Submit application'} <span>→</span></button>
      </form>
    </>}
  </section></div>;
}
