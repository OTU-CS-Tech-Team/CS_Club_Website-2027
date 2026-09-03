'use client';

import { FormEvent, useState } from 'react';
import styles from './landing.module.css';

export const YEARS = ['1st year', '2nd year', '3rd year', '4th year', 'Graduate'];
const EMAIL_PATTERN = /@ontariotechu\.(net|ca)$/i;

type EventSignupFormProps = {
  eventTitle: string;
};

export default function EventSignupForm({ eventTitle }: EventSignupFormProps) {
  const [error, setError] = useState('');
  const [done, setDone] = useState<{ name: string; email: string } | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const first = String(data.get('firstName') ?? '').trim();
    const last = String(data.get('lastName') ?? '').trim();
    const email = String(data.get('email') ?? '').trim();
    const year = String(data.get('year') ?? '').trim();

    if (!first || !last || !email || !year) {
      setError('Fill in name, Ontario Tech email, and year of study.');
      return;
    }

    if (!EMAIL_PATTERN.test(email)) {
      setError('Use your Ontario Tech email (@ontariotechu.net or @ontariotechu.ca).');
      return;
    }

    setError('');
    setDone({ name: `${first} ${last}`, email });
  }

  if (done) {
    return (
      <p className={styles.success}>
        {done.name}, you’re on the sheet for {eventTitle}. We’ll write to {done.email}
        . Nothing is stored on a server yet — this is the local confirmation.
      </p>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <h3 className={styles.formTitle}>Sign up sheet</h3>
      <div className={styles.field}>
        <label htmlFor="firstName">First name</label>
        <input id="firstName" name="firstName" type="text" autoComplete="given-name" required />
      </div>
      <div className={styles.field}>
        <label htmlFor="lastName">Last name</label>
        <input id="lastName" name="lastName" type="text" autoComplete="family-name" required />
      </div>
      <div className={`${styles.field} ${styles.fieldWide}`}>
        <label htmlFor="email">Ontario Tech email</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="name@ontariotechu.net"
          required
        />
      </div>
      <div className={`${styles.field} ${styles.fieldWide}`}>
        <label htmlFor="year">Year of study</label>
        <select id="year" name="year" defaultValue="" required>
          <option value="" disabled>
            Select year
          </option>
          {YEARS.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>
      <div className={`${styles.field} ${styles.fieldWide}`}>
        <label htmlFor="questions">Questions (optional)</label>
        <textarea id="questions" name="questions" />
      </div>
      {error ? <p className={styles.formError}>{error}</p> : null}
      <div className={styles.formActions}>
        <button type="submit" className={styles.cta}>
          Sign up
        </button>
      </div>
    </form>
  );
}
