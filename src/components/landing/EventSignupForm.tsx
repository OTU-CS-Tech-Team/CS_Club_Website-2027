"use client";

import { FormEvent, useState } from "react";
import { YearSelect } from "../careers/CareerApplicationForm";
import styles from "../careers/careers.module.css";

const EMAIL_PATTERN = /@ontariotechu\.(net|ca)$/i;

type EventSignupFormProps = {
  eventTitle: string;
};

export default function EventSignupForm({ eventTitle }: EventSignupFormProps) {
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ name: string; email: string } | null>(
    null,
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const first = String(data.get("firstName") ?? "").trim();
    const last = String(data.get("lastName") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const year = String(data.get("year") ?? "").trim();

    if (!first || !last || !email || !year) {
      setError("Fill in name, Ontario Tech email, and year of study.");
      return;
    }

    if (!EMAIL_PATTERN.test(email)) {
      setError(
        "Use your Ontario Tech email (@ontariotechu.net or @ontariotechu.ca).",
      );
      return;
    }

    setError("");
    setDone({ name: `${first} ${last}`, email });
  }

  if (done) {
    return (
      <div className={styles.success}>
        <h3>You&apos;re on the sheet.</h3>
        <p>
          {done.name}, you&apos;re signed up for {eventTitle}. We&apos;ll write
          to {done.email}. Nothing is stored on a server yet. This is the local
          confirmation.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className={styles.formGrid}>
        <label>
          First name
          <input
            name="firstName"
            autoComplete="given-name"
            aria-required="true"
          />
        </label>
        <label>
          Last name
          <input
            name="lastName"
            autoComplete="family-name"
            aria-required="true"
          />
        </label>
        <label className={styles.fullWidth}>
          Ontario Tech email
          <input
            type="email"
            name="email"
            autoComplete="email"
            placeholder="first.last@ontariotechu.net"
            aria-required="true"
          />
        </label>
        <label className={styles.fullWidth}>
          Year of study
          <YearSelect />
        </label>
        <label className={styles.fullWidth}>
          Suggestions for future events (optional)
          <textarea
            name="suggestions"
            rows={4}
            maxLength={2000}
            placeholder="Anything you'd love the club to run next..."
          />
        </label>
      </div>
      {error ? (
        <p className={styles.formError} role="alert">
          {error}
        </p>
      ) : null}
      <button type="submit" className={styles.submit}>
        Sign up <span aria-hidden="true">→</span>
      </button>
    </form>
  );
}
