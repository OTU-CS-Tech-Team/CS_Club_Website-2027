import { previewGuestCancel, cancelGuestRsvpForm } from '@/app/events/actions';
import styles from '@/components/landing/landing.module.css';

export const metadata = {
  title: 'Cancel RSVP',
  description: 'Cancel a guest event RSVP.',
};

export const dynamic = 'force-dynamic';

export default async function GuestCancelPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; done?: string; msg?: string }>;
}) {
  const { token, done, msg } = await searchParams;

  if (done === '1' || done === '0') {
    return (
      <CancelShell
        title={done === '1' ? 'RSVP cancelled' : 'Could not cancel'}
        message={msg || (done === '1' ? 'Your RSVP has been cancelled.' : 'Something went wrong.')}
      />
    );
  }

  if (!token) {
    return (
      <CancelShell
        title="Could not cancel"
        message="Missing cancel link. Open the link from your confirmation email."
      />
    );
  }

  const preview = await previewGuestCancel(token);
  if (!preview.ok) {
    return <CancelShell title="Could not cancel" message={preview.message} />;
  }

  return (
    <div className={styles.landing}>
      <div className={styles.shell} style={{ paddingTop: '4rem', maxWidth: '32rem' }}>
        <p className={styles.kicker}>CS Club</p>
        <h1 className={styles.headline} style={{ fontSize: '2rem' }}>
          Cancel your RSVP?
        </h1>
        <p style={{ marginTop: '1rem', lineHeight: 1.5 }}>
          Confirm below to cancel. Opening this page alone does not remove your RSVP.
        </p>
        <form action={cancelGuestRsvpForm} style={{ marginTop: '1.5rem' }}>
          <input type="hidden" name="token" value={token} />
          <button type="submit" className={styles.cta}>
            Yes, cancel my RSVP
          </button>
        </form>
        <p style={{ marginTop: '1.5rem' }}>
          <a href="/events">Keep my RSVP / back to events</a>
        </p>
      </div>
    </div>
  );
}

function CancelShell({ title, message }: { title: string; message: string }) {
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
