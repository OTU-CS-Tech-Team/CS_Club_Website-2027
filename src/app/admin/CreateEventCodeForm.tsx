'use client';

import { useState, type FormEvent } from 'react';
import QRCode from 'qrcode';

export default function CreateEventCodeForm() {
  const [label, setLabel] = useState('');
  const [points, setPoints] = useState(10);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [claimUrl, setClaimUrl] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('');
    setLoading(true);

    const response = await fetch('/api/admin/event-codes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label, points }),
    });
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setStatus(data.error ?? 'Something went wrong.');
      return;
    }

    const url = `${window.location.origin}/passport/claim?code=${data.code}`;
    setClaimUrl(url);
    setQrDataUrl(await QRCode.toDataURL(url));
    setLabel('');
  }

  return (
    <div>
      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          Stamp label
          <input value={label} onChange={(event) => setLabel(event.target.value)} required />
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
          {loading ? 'Creating…' : 'Create QR code'}
        </button>
      </form>

      {status && (
        <p role="status" aria-live="polite">
          {status}
        </p>
      )}

      {qrDataUrl && (
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrDataUrl} alt="Scan to claim this stamp" width={200} height={200} />
          <p>
            <code>{claimUrl}</code>
          </p>
        </div>
      )}
    </div>
  );
}
