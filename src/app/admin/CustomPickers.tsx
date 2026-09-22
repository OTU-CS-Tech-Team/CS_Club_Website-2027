'use client';

import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { JOB_CATEGORIES } from '@/data/jobCategories';
import styles from './admin.module.css';

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function formatDateValue(date: Date) {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

function parseDateValue(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12));
}

function monthStart(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 12));
}

function monthLabel(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

function longDateLabel(value: string) {
  const date = parseDateValue(value);
  return date
    ? new Intl.DateTimeFormat('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'UTC',
      }).format(date)
    : 'Select date';
}

function shiftMonth(date: Date, amount: number) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + amount, 1, 12));
}

export function DatePicker({
  name,
  value,
  onChange,
  ariaLabel = 'Choose event date',
}: {
  name: string;
  value: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => monthStart(parseDateValue(value) ?? new Date()));
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  const selectedDate = parseDateValue(value);
  const firstDayOffset = (visibleMonth.getUTCDay() + 6) % 7;
  const days = Array.from({ length: 42 }, (_, index) =>
    new Date(Date.UTC(visibleMonth.getUTCFullYear(), visibleMonth.getUTCMonth(), index - firstDayOffset + 1, 12)),
  );

  return (
    <div className={styles.picker} ref={containerRef}>
      <input type="hidden" name={name} value={value} />
      <button
        type="button"
        className={styles.pickerButton}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span>{longDateLabel(value)}</span>
        <span className={styles.pickerChevron} aria-hidden="true">⌄</span>
      </button>
      {open ? (
        <div className={styles.calendarPopover} role="dialog" aria-label={ariaLabel}>
          <div className={styles.calendarHeader}>
            <button type="button" onClick={() => setVisibleMonth((current) => shiftMonth(current, -1))} aria-label="Previous month">←</button>
            <strong>{monthLabel(visibleMonth)}</strong>
            <button type="button" onClick={() => setVisibleMonth((current) => shiftMonth(current, 1))} aria-label="Next month">→</button>
          </div>
          <div className={styles.calendarWeekdays} aria-hidden="true">
            {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((day) => <span key={day}>{day}</span>)}
          </div>
          <div className={styles.calendarGrid}>
            {days.map((day) => {
              const dayValue = formatDateValue(day);
              const inMonth = day.getUTCMonth() === visibleMonth.getUTCMonth();
              const isSelected = selectedDate ? dayValue === formatDateValue(selectedDate) : false;
              return (
                <button
                  type="button"
                  key={dayValue}
                  className={`${styles.calendarDay} ${inMonth ? '' : styles.calendarDayMuted} ${isSelected ? styles.calendarDaySelected : ''}`}
                  aria-pressed={isSelected}
                  onClick={() => {
                    onChange(dayValue);
                    setOpen(false);
                  }}
                >
                  {day.getUTCDate()}
                </button>
              );
            })}
          </div>
          <div className={styles.calendarFooter}>
            <button type="button" onClick={() => { onChange(''); setOpen(false); }}>Clear</button>
            <button type="button" onClick={() => { onChange(formatDateValue(new Date())); setOpen(false); }}>Today</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function CategoryPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const isPreset = JOB_CATEGORIES.some((category) => category === value);
  const [open, setOpen] = useState(false);
  const [customMode, setCustomMode] = useState(Boolean(value && !isPreset));
  const [highlighted, setHighlighted] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  function toggle() {
    setOpen((current) => {
      if (!current) setHighlighted(isPreset ? value : JOB_CATEGORIES[0]);
      return !current;
    });
  }

  function handleKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>) {
    const currentIndex = JOB_CATEGORIES.indexOf(highlighted as (typeof JOB_CATEGORIES)[number]);
    if (event.key === 'Escape') setOpen(false);
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (open && highlighted) {
        onChange(highlighted);
        setOpen(false);
      } else {
        toggle();
      }
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlighted(JOB_CATEGORIES[Math.min(currentIndex + 1, JOB_CATEGORIES.length - 1)]);
      setOpen(true);
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlighted(JOB_CATEGORIES[Math.max(currentIndex, 1) - 1]);
      setOpen(true);
    }
  }

  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  return (
    <div className={styles.picker} ref={containerRef}>
      <input type="hidden" name="category" value={value} />
      {customMode ? (
        <div className={styles.customCategory}>
          <input
            aria-label="Custom job category"
            autoFocus
            maxLength={80}
            placeholder="Enter a category"
            value={value}
            onChange={(event) => onChange(event.target.value)}
          />
          <button
            type="button"
            className={styles.textButton}
            onClick={() => {
              setCustomMode(false);
              onChange('');
            }}
          >
            Use a suggested category
          </button>
        </div>
      ) : (
        <>
          <button
            type="button"
            className={styles.pickerButton}
            aria-haspopup="listbox"
            aria-expanded={open}
            onClick={toggle}
            onKeyDown={handleKeyDown}
          >
            <span>{value || 'Select category'}</span>
            <span className={styles.pickerChevron} aria-hidden="true">⌄</span>
          </button>
          {open ? (
            <div className={styles.choicePopover} role="listbox" aria-label="Choose job category">
              {JOB_CATEGORIES.map((category) => (
                <button
                  type="button"
                  role="option"
                  aria-selected={value === category}
                  className={highlighted === category ? styles.choiceOptionSelected : styles.choiceOption}
                  key={category}
                  onFocus={() => setHighlighted(category)}
                  onMouseEnter={() => setHighlighted(category)}
                  onClick={() => {
                    onChange(category);
                    setHighlighted(category);
                    setOpen(false);
                  }}
                >
                  {category}
                </button>
              ))}
              <button
                type="button"
                role="option"
                aria-selected="false"
                className={styles.choiceOption}
                onClick={() => {
                  onChange('');
                  setCustomMode(true);
                  setOpen(false);
                }}
              >
                Custom category
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

type TimeParts = { hour: number; minute: number; period: 'AM' | 'PM' };

function parseTimeValue(value: string): TimeParts {
  const match = value.match(/^(\d{2}):(\d{2})$/);
  if (!match) return { hour: 6, minute: 0, period: 'PM' };
  const hours = Number(match[1]);
  return {
    hour: hours % 12 || 12,
    minute: Number(match[2]),
    period: hours >= 12 ? 'PM' : 'AM',
  };
}

function formatTimeValue({ hour, minute, period }: TimeParts) {
  const hours24 = period === 'PM' ? (hour % 12) + 12 : hour % 12;
  return `${pad(hours24)}:${pad(minute)}`;
}

function timeLabel(value: string) {
  const match = value.match(/^(\d{2}):(\d{2})$/);
  if (!match) return 'Select time';
  const hours = Number(match[1]);
  return `${hours % 12 || 12}:${match[2]} ${hours >= 12 ? 'PM' : 'AM'}`;
}

export function TimePicker({
  name,
  value,
  onChange,
}: {
  name: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [parts, setParts] = useState<TimeParts>(() => parseTimeValue(value));
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  const update = (next: Partial<TimeParts>) => {
    const nextParts = { ...parts, ...next };
    setParts(nextParts);
    onChange(formatTimeValue(nextParts));
  };

  return (
    <div className={styles.picker} ref={containerRef}>
      <input type="hidden" name={name} value={value} />
      <button
        type="button"
        className={styles.pickerButton}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span>{timeLabel(value)}</span>
        <span className={styles.pickerChevron} aria-hidden="true">⌄</span>
      </button>
      {open ? (
        <div className={styles.timePopover} role="dialog" aria-label={`Choose ${name === 'startTime' ? 'start' : 'end'} time`}>
          <div className={styles.timeColumns}>
            <div className={styles.timeColumn} aria-label="Hour">
              {Array.from({ length: 12 }, (_, index) => index + 1).map((hour) => (
                <button type="button" key={hour} className={parts.hour === hour ? styles.timeOptionSelected : styles.timeOption} onClick={() => update({ hour })}>{pad(hour)}</button>
              ))}
            </div>
            <div className={styles.timeColumn} aria-label="Minute">
              {Array.from({ length: 60 }, (_, minute) => minute).map((minute) => (
                <button type="button" key={minute} className={parts.minute === minute ? styles.timeOptionSelected : styles.timeOption} onClick={() => update({ minute })}>{pad(minute)}</button>
              ))}
            </div>
            <div className={styles.timeColumn} aria-label="AM or PM">
              {(['AM', 'PM'] as const).map((period) => (
                <button type="button" key={period} className={parts.period === period ? styles.timeOptionSelected : styles.timeOption} onClick={() => update({ period })}>{period}</button>
              ))}
            </div>
          </div>
          <button type="button" className={styles.pickerDone} onClick={() => setOpen(false)}>Done</button>
        </div>
      ) : null}
    </div>
  );
}
