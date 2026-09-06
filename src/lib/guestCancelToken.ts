import { createHmac, timingSafeEqual } from 'crypto';

export type SignedPurpose = 'guest-cancel' | 'guest-verify' | 'mailing-verify';

type SignedPayload = {
  purpose: SignedPurpose;
  guestId?: string;
  eventId?: string;
  subscriberId?: string;
  exp: number;
};

const DAY_MS = 24 * 60 * 60 * 1000;
export const GUEST_CANCEL_TTL_MS = 30 * DAY_MS;
export const VERIFY_TTL_MS = 2 * DAY_MS;

function signingSecret() {
  return (
    process.env.GUEST_CANCEL_SECRET ||
    process.env.CRON_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    ''
  );
}

export function siteOrigin() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/$/, '');

  const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (productionHost) return `https://${productionHost.replace(/^https?:\/\//, '').replace(/\/$/, '')}`;

  const vercelHost = process.env.VERCEL_URL?.trim();
  if (vercelHost) return `https://${vercelHost.replace(/^https?:\/\//, '').replace(/\/$/, '')}`;

  return 'http://localhost:3000';
}

function signPayload(payload: SignedPayload) {
  const secret = signingSecret();
  if (!secret) throw new Error('Missing signing secret for email action links.');
  const body = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = createHmac('sha256', secret).update(body).digest('base64url');
  return `${body}.${sig}`;
}

export function verifySignedToken(token: string, purpose: SignedPurpose): SignedPayload | null {
  const secret = signingSecret();
  if (!secret || !token.includes('.')) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const expected = createHmac('sha256', secret).update(body).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as SignedPayload;
    if (parsed.purpose !== purpose) return null;
    if (!parsed.exp || Date.now() > parsed.exp) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function guestCancelUrl(opts: { guestId: string; eventId: string }) {
  const token = signPayload({
    purpose: 'guest-cancel',
    guestId: opts.guestId,
    eventId: opts.eventId,
    exp: Date.now() + GUEST_CANCEL_TTL_MS,
  });
  return `${siteOrigin()}/events/guest-cancel?token=${encodeURIComponent(token)}`;
}

export function guestVerifyUrl(opts: { guestId: string; eventId: string }) {
  const token = signPayload({
    purpose: 'guest-verify',
    guestId: opts.guestId,
    eventId: opts.eventId,
    exp: Date.now() + VERIFY_TTL_MS,
  });
  return `${siteOrigin()}/events/guest-confirm?token=${encodeURIComponent(token)}`;
}

export function mailingVerifyUrl(opts: { subscriberId: string }) {
  const token = signPayload({
    purpose: 'mailing-verify',
    subscriberId: opts.subscriberId,
    exp: Date.now() + VERIFY_TTL_MS,
  });
  return `${siteOrigin()}/mailing-list/confirm?token=${encodeURIComponent(token)}`;
}

export function verifyGuestCancelToken(token: string) {
  const parsed = verifySignedToken(token, 'guest-cancel');
  if (!parsed?.guestId || !parsed.eventId) return null;
  return { guestId: parsed.guestId, eventId: parsed.eventId };
}

export function verifyGuestVerifyToken(token: string) {
  const parsed = verifySignedToken(token, 'guest-verify');
  if (!parsed?.guestId || !parsed.eventId) return null;
  return { guestId: parsed.guestId, eventId: parsed.eventId };
}

export function verifyMailingVerifyToken(token: string) {
  const parsed = verifySignedToken(token, 'mailing-verify');
  if (!parsed?.subscriberId) return null;
  return { subscriberId: parsed.subscriberId };
}
