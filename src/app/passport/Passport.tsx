'use client';

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState, type ReactNode } from 'react';
import PassportQr from './PassportQr';
import styles from './passport.module.css';

type Stamp = { id: string; label: string; points: number; awarded_at: string };

const TIERS = [
  { name: 'Bronze', min: 0 },
  { name: 'Silver', min: 100 },
  { name: 'Gold', min: 200 },
];

const SOCIALS = [
  // scale compensates for the transparent padding baked into each exported logo
  { label: 'Instagram', href: 'https://www.instagram.com/otu.csclub/', src: '/passport/instagram.png', scale: 3 },
  { label: 'TikTok', href: 'https://www.tiktok.com/@otu.csclub', src: '/passport/tiktok.png', scale: 0.9 },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/company/otu-cs-club/', src: '/passport/linkedin.png', scale: 1.2 },
];

// Fixed timezone so server and browser render the same date (avoids hydration mismatch).
const stampDate = (iso: string) => new Date(iso).toLocaleDateString('en-CA', { dateStyle: 'medium', timeZone: 'America/Toronto' });

function tierFor(points: number) {
  const index = TIERS.filter((tier) => points >= tier.min).length - 1;
  return { tier: TIERS[index], next: TIERS[index + 1] };
}

function Avatar({ size }: { size: 'ring' | 'large' }) {
  return <span className={size === 'ring' ? styles.avatarRing : styles.avatarLarge} role="img" aria-label="Profile picture" />;
}

function Header({ title, subtitle, tall }: { title: string; subtitle: string; tall?: boolean }) {
  return (
    <header className={tall ? styles.headerTall : styles.header}>
      <div className={styles.nameStack}>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {tall ? null : <Avatar size="ring" />}
    </header>
  );
}

function Dialog({ label, onClose, className, children }: { label: string; onClose: () => void; className: string; children: ReactNode }) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  return (
    <div className={styles.backdrop} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className={`${styles.popup} ${className}`} role="dialog" aria-modal="true" aria-label={label}>
        <button className={styles.closeButton} type="button" onClick={onClose} autoFocus>Close</button>
        {children}
      </section>
    </div>
  );
}

export default function Passport({ name, stamps, initialQrDataUrl }: { name: string; stamps: Stamp[]; initialQrDataUrl: string }) {
  const [flipped, setFlipped] = useState(false);
  const [certificate, setCertificate] = useState<Stamp | null>(null);
  const [eventsOpen, setEventsOpen] = useState(false);
  const [socialsOpen, setSocialsOpen] = useState(false);

  const totalPoints = stamps.reduce((sum, stamp) => sum + stamp.points, 0);
  const { tier, next } = tierFor(totalPoints);
  const progress = next ? Math.min(100, (totalPoints / next.min) * 100) : 100;
  const handle = `otu.csclub • ${name}`;

  return (
    <div className={styles.page}>
      <div className={`${styles.flipper} ${flipped ? styles.flipped : ''}`}>
        <article className={`${styles.card} ${styles.front}`} inert={flipped} aria-label="Passport profile">
          <Header title="WELCOME" subtitle={name} />
          <div className={styles.photoFrame}><Avatar size="large" /></div>
          <section className={styles.glassPanel} aria-labelledby="stats-heading">
            <h2 id="stats-heading" className={styles.panelTitle}>Your Stats</h2>
            <dl className={styles.stats}>
              <div><dt>Tier:</dt><dd>{tier.name}</dd></div>
              <div><dt>Badges:</dt><dd>{stamps.length}</dd></div>
              <div><dt>Total Points:</dt><dd>{totalPoints}</dd></div>
            </dl>
            <p className={styles.progressLabel}>
              {next ? `${tier.name} Tier -- ${totalPoints}/${next.min} Points` : `${tier.name} Tier -- max tier reached`}
            </p>
            <div className={styles.progressTrack} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)} aria-label={next ? `Progress to ${next.name}` : 'Tier progress'}>
              <span className={styles.progressFill} style={{ width: `${progress}%` }} />
            </div>
          </section>
          <button className={styles.pillButton} type="button" onClick={() => setFlipped(true)}>↻ tap for check-in QR-Code</button>
          <button className={styles.clubButton} type="button" onClick={() => setSocialsOpen(true)} aria-label="Connect with CS Club">
            <img src="/passport/cs-club-computer.png" alt="" />
          </button>
        </article>

        <article className={`${styles.card} ${styles.back}`} inert={!flipped} aria-label={certificate ? 'Event certificate' : 'Check-in QR code'}>
          {certificate ? (
            <div className={styles.certificate} key={certificate.id}>
              <Header title="CONGRATULATIONS" subtitle="on your achievement!" tall />
              <div className={styles.trophy}><img src="/passport/trophy.png" alt="Trophy" /></div>
              <p className={styles.handlePill}>{handle}</p>
              <div className={styles.yellowBlock}>
                <strong>{certificate.label}</strong>
                <span>Points Awarded: {certificate.points} points</span>
                <small>{stampDate(certificate.awarded_at)}</small>
              </div>
              <button className={styles.pillButton} type="button" onClick={() => setCertificate(null)}>↻ back to check-in QR-Code</button>
            </div>
          ) : null}
          {/* Stays mounted under the certificate so the QR keeps refreshing its token. */}
          <div className={styles.checkinView} hidden={Boolean(certificate)}>
            <Header title="//Check-In//" subtitle="scan this at the event" />
            <div className={styles.photoFrame}>
              <PassportQr className={styles.qr} initialQrDataUrl={initialQrDataUrl} />
            </div>
            <section className={`${styles.glassPanel} ${styles.statusPanel}`}>
              <h2 className={styles.panelTitle}>Status: Verified</h2>
              <p className={styles.handle}>{handle}</p>
            </section>
            <button className={styles.bigButton} type="button" onClick={() => setEventsOpen(true)}>Events List</button>
            <button className={styles.pillButton} type="button" onClick={() => setFlipped(false)}>↻ back to profile</button>
          </div>
        </article>
      </div>

      {eventsOpen ? (
        <Dialog label="Events attended" className={styles.eventsPopup} onClose={() => setEventsOpen(false)}>
          <h2 className={styles.eventsTitle}>Events</h2>
          {stamps.length ? (
            <ul className={styles.eventsList}>
              {stamps.map((stamp) => (
                <li key={stamp.id}>
                  <button type="button" onClick={() => { setCertificate(stamp); setEventsOpen(false); setFlipped(true); }}>
                    <span>{stamp.label}</span>
                    <small>{stampDate(stamp.awarded_at)} · {stamp.points} pts</small>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.emptyEvents}>No events yet — check in at your first event to earn a stamp.</p>
          )}
        </Dialog>
      ) : null}

      {socialsOpen ? (
        <Dialog label="Connect with us" className={styles.socialPopup} onClose={() => setSocialsOpen(false)}>
          <h2 className={styles.socialTitle}>Connect with us!</h2>
          <div className={styles.socialIcons}>
            {SOCIALS.map((social) => (
              <a key={social.label} href={social.href} target="_blank" rel="noreferrer" aria-label={social.label}>
                <img src={social.src} alt="" style={{ transform: `scale(${social.scale})` }} />
              </a>
            ))}
          </div>
          <p className={styles.socialCaption}>@otu.csclub</p>
          <a className={styles.websiteLink} href="/">
            <img src="/passport/cs-club-computer.png" alt="" />
            <span className={styles.socialCaption}>Our Official Website</span>
          </a>
        </Dialog>
      ) : null}
    </div>
  );
}
