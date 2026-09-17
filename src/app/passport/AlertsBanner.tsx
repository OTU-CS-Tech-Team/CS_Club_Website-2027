'use client';

import { useEffect, useState } from 'react';
import { subscribeLoggedIn } from '@/app/mailing-list/actions';
import styles from './passport.module.css';

// Google sign-in skips the signup form, so SSO members never see the alerts
// checkbox. This asks once. "No thanks" is remembered per device — the server
// only renders this for members who are not subscribed yet.
const DISMISSED_KEY = 'csclub.alertsBannerDismissed';

export default function AlertsBanner() {
  const [visible, setVisible] = useState(false);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState('');

  useEffect(() => {
    try {
      if (localStorage.getItem(DISMISSED_KEY) !== '1') setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(DISMISSED_KEY, '1');
    } catch {
      // Private browsing or blocked storage — it just asks again next visit.
    }
    setVisible(false);
  }

  async function join() {
    setPending(true);
    try {
      await subscribeLoggedIn();
      setDone("You're on the list.");
      dismiss();
    } catch {
      setDone('Could not sign you up — try the home page.');
    }
    setPending(false);
  }

  if (done) return <p className={styles.alertsBanner}>{done}</p>;
  if (!visible) return null;

  return (
    <div className={styles.alertsBanner} role="region" aria-label="Event alerts">
      <p>Want an email when we announce an event?</p>
      <div className={styles.alertsBannerActions}>
        <button type="button" onClick={join} disabled={pending}>
          {pending ? 'Signing up...' : 'Yes, email me'}
        </button>
        <button type="button" onClick={dismiss} disabled={pending}>
          No thanks
        </button>
      </div>
    </div>
  );
}
