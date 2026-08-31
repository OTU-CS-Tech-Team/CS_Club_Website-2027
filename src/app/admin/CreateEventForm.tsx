'use client';

import { useState, type FormEvent } from 'react';

export default function CreateEventForm() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [points, setPoints] = useState(10);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('');
    setLoading(true);

    const response = await fetch('/api/admin/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        description,
        location,
        startsAt: startsAt || null,
        points,
      }),
    });
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setStatus(data.error ?? 'Something went wrong.');
      return;
    }

    setStatus(`"${title}" created.`);
    setTitle('');
    setDescription('');
    setLocation('');
    setStartsAt('');
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <label>
        Title
        <input value={title} onChange={(event) => setTitle(event.target.value)} required />
      </label>
      <label>
        Description
        <input value={description} onChange={(event) => setDescription(event.target.value)} />
      </label>
      <label>
        Location
        <input value={location} onChange={(event) => setLocation(event.target.value)} />
      </label>
      <label>
        Date/time
        <input
          type="datetime-local"
          value={startsAt}
          onChange={(event) => setStartsAt(event.target.value)}
        />
      </label>
      <label>
        Points
        <input
          type="number"
          min={0}
          value={points}
          onChange={(event) => setPoints(Number(event.target.value))}
          required
        />
      </label>
      <button type="submit" disabled={loading}>
        {loading ? 'Creating…' : 'Create event'}
      </button>
      {status && (
        <p role="status" aria-live="polite">
          {status}
        </p>
      )}
    </form>
  );
}
