'use client';

import { useState } from 'react';
import { sendNewsletter } from './actions';

export default function NewsletterForm({ recipientCount }: { recipientCount: number }) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [status, setStatus] = useState('');
  const [sending, setSending] = useState(false);

  async function handleSend(testOnly: boolean) {
    setStatus('');
    setSending(true);
    try {
      const { sent, failed } = await sendNewsletter(subject, body, testOnly);
      if (testOnly) {
        setStatus('Test sent to your own email — check your inbox.');
      } else {
        setStatus(
          failed > 0
            ? `Sent to ${sent} member(s) — ${failed} failed, check the server logs.`
            : `Sent to ${sent} member(s).`
        );
        setSubject('');
        setBody('');
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not send — try again.');
    }
    setSending(false);
  }

  return (
    <form
      className="auth-form"
      onSubmit={(event) => {
        event.preventDefault();
        handleSend(false);
      }}
    >
      <p>Will send to {recipientCount} member(s).</p>
      <label>
        Subject
        <input value={subject} onChange={(event) => setSubject(event.target.value)} required />
      </label>
      <label>
        Body
        <textarea
          rows={10}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          required
        />
      </label>
      <button type="button" onClick={() => handleSend(true)} disabled={sending}>
        {sending ? 'Sending…' : 'Send test to myself'}
      </button>
      <button type="submit" disabled={sending}>
        {sending ? 'Sending…' : `Send to all ${recipientCount} member(s)`}
      </button>
      {status && (
        <p role="status" aria-live="polite">
          {status}
        </p>
      )}
    </form>
  );
}
