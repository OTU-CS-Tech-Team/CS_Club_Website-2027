'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import styles from '../login.module.css';

const EXPIRED =
  'This reset link has expired or was already used. Request a new one, and open it in the same browser you requested it from.';

// The reset email links straight here. Supabase adds either ?code= (default
// email template; the browser client signs in with it on load) or
// ?token_hash= (custom template; verified on submit so email link scanners
// can't use up the one-time token), or ?error= when the link is dead.
export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  const [expired, setExpired] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.slice(1));
    if (query.get('error') || hash.get('error')) setExpired(true);
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('');
    setLoading(true);
    const supabase = createClient();

    const tokenHash = new URLSearchParams(window.location.search).get('token_hash');
    if (tokenHash) {
      const { error } = await supabase.auth.verifyOtp({ type: 'recovery', token_hash: tokenHash });
      if (error) {
        setLoading(false);
        setExpired(true);
        return;
      }
    }

    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      if (error.name === 'AuthSessionMissingError') setExpired(true);
      else setStatus(error.message);
      return;
    }
    router.push('/passport');
  }

  return (
    <div className={styles.screen}>
      <div className={styles.stack}>
        <h1>Set a new password</h1>
        {expired ? (
          <>
            <p role="alert" className={styles.error}>{EXPIRED}</p>
            <Link href="/login">Back to log in</Link>
          </>
        ) : (
          <>
            <p>Choose a new password for your account.</p>
            <form className="auth-form" onSubmit={handleSubmit}>
              <label>
                New password
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="new-password"
                  required
                  minLength={6}
                />
              </label>
              <button type="submit" disabled={loading}>Save password</button>
            </form>
            {status && <p role="alert" className={styles.error}>{status}</p>}
          </>
        )}
      </div>
    </div>
  );
}
