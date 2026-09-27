import { previewGuestVerify, confirmGuestRsvpForm } from '@/app/events/actions';
import styles from '@/components/landing/landing.module.css';

export const metadata = {
  title: 'Confirm RSVP',
  description: 'Confirm a guest event RSVP.',
};

export const dynamic = 'force-dynamic';

export default async function GuestConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; done?: string; msg?: string }>;
}) {
  const { token, done, msg } = await searchParams;

  if (done === '1' || done === '0') {
    return (
      <Shell
        title={done === '1' ? 'RSVP confirmed' : 'Could not confirm'}
        message={msg || (done === '1' ? 'Your RSVP is confirmed.' : 'Something went wrong.')}
      />
    );
  }

  if (!token) {
    return <Shell title="Could not confirm" message="Missing confirm link. Open the link from your email." />;
  }

  const preview = await previewGuestVerify(token);
  if (!preview.ok) {
    return <Shell title="Could not confirm" message={preview.message} />;
  }

  if (preview.alreadyConfirmed) {
    return <Shell title="Already confirmed" message="This RSVP was already confirmed." />;
  }

  return (
    <div className={styles.landing}>
      <div className={styles.shell} style={{ paddingTop: '4rem', maxWidth: '32rem' }}>
        <p className={styles.kicker}>CS Club</p>
        <h1 className={styles.headline} style={{ fontSize: '2rem' }}>
          Confirm your RSVP?
        </h1>
        <p style={{ marginTop: '1rem', lineHeight: 1.5 }}>
          Confirm below to finish signing up. Opening this page alone does not confirm your RSVP.
        </p>
        <form action={confirmGuestRsvpForm} style={{ marginTop: '1.5rem' }}>
          <input type="hidden" name="token" value={token} />
          <button type="submit" className={styles.cta}>
            Yes, confirm my RSVP
          </button>
        </form>
        <p style={{ marginTop: '1.5rem' }}>
          <a href="/events">Back to events</a>
        </p>
      </div>
    </div>
  );
}

function Shell({ title, message }: { title: string; message: string }) {
  return (
    <div className={styles.landing}>
      <div className={styles.shell} style={{ paddingTop: '4rem', maxWidth: '32rem' }}>
        <p className={styles.kicker}>CS Club</p>
        <h1 className={styles.headline} style={{ fontSize: '2rem' }}>
          {title}
        </h1>
        <p style={{ marginTop: '1rem', lineHeight: 1.5 }}>{message}</p>
        <p style={{ marginTop: '1.5rem' }}>
          <a href="/events">Back to events</a>
        </p>
      </div>
    </div>
  );
}
