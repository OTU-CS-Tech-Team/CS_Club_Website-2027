import { previewMailingConfirm, confirmMailingSignupForm } from '@/app/mailing-list/actions';
import styles from '@/components/landing/landing.module.css';

export const metadata = {
  title: 'Confirm Mailing List',
  description: 'Confirm your CS Club mailing list signup.',
};

export const dynamic = 'force-dynamic';

export default async function MailingConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; done?: string; msg?: string }>;
}) {
  const { token, done, msg } = await searchParams;

  if (done === '1' || done === '0') {
    return (
      <Shell
        title={done === '1' ? "You're on the list" : 'Could not confirm'}
        message={msg || (done === '1' ? "You're on the mailing list." : 'Something went wrong.')}
      />
    );
  }

  if (!token) {
    return <Shell title="Could not confirm" message="Missing confirm link. Open the link from your email." />;
  }

  const preview = await previewMailingConfirm(token);
  if (!preview.ok) {
    return <Shell title="Could not confirm" message={preview.message} />;
  }

  if (preview.alreadyConfirmed) {
    return <Shell title="Already confirmed" message="This email is already on the mailing list." />;
  }

  return (
    <div className={styles.landing}>
      <div className={styles.shell} style={{ paddingTop: '4rem', maxWidth: '32rem' }}>
        <p className={styles.kicker}>CS Club</p>
        <h1 className={styles.headline} style={{ fontSize: '2rem' }}>
          Confirm mailing list signup?
        </h1>
        <p style={{ marginTop: '1rem', lineHeight: 1.5 }}>
          Confirm below to join. Opening this page alone does not add you to the list.
        </p>
        <form action={confirmMailingSignupForm} style={{ marginTop: '1.5rem' }}>
          <input type="hidden" name="token" value={token} />
          <button type="submit" className={styles.cta}>
            Yes, join the mailing list
          </button>
        </form>
        <p style={{ marginTop: '1.5rem' }}>
          <a href="/">Back home</a>
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
          <a href="/">Back home</a>
        </p>
      </div>
    </div>
  );
}
