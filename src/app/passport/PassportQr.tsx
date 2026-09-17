'use client';

import { useEffect, useState } from 'react';
import { mintCheckinToken } from './actions';

const REFRESH_MS = 5 * 60 * 1000; // matches checkin_tokens.expires_at (5 min)

export default function PassportQr({ initialQrDataUrl, className }: { initialQrDataUrl: string; className?: string }) {
  const [qrDataUrl, setQrDataUrl] = useState(initialQrDataUrl);

  useEffect(() => {
    const interval = setInterval(async () => {
      const next = await mintCheckinToken();
      setQrDataUrl(next.qrDataUrl);
    }, REFRESH_MS);

    return () => clearInterval(interval);
  }, []);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img className={className} src={qrDataUrl} alt="Your check-in QR code. Show this to an exec to check in — it refreshes every 5 minutes." width={200} height={200} />
  );
}
