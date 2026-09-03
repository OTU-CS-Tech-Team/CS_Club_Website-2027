'use client';

import { useEffect, useState } from 'react';
import { mintCheckinToken } from './actions';

const REFRESH_MS = 5 * 60 * 1000; // matches checkin_tokens.expires_at (5 min)

export default function PassportQr({ initialQrDataUrl }: { initialQrDataUrl: string }) {
  const [qrDataUrl, setQrDataUrl] = useState(initialQrDataUrl);

  useEffect(() => {
    const interval = setInterval(async () => {
      const next = await mintCheckinToken();
      setQrDataUrl(next.qrDataUrl);
    }, REFRESH_MS);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="checkin-qr">
      <p>Show this to an exec to check in at an event — it refreshes every 5 minutes.</p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={qrDataUrl} alt="Your check-in QR code" width={200} height={200} />
    </div>
  );
}
