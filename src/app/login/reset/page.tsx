'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import styles from '../login.module.css';

// The reset email lands on /auth/callback, which signs the user in and sends
// them here; all that's left is choosing the new password.
export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const { error } = await createClient().auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setStatus(
        error.name === 'AuthSessionMissingError'
          ? 'This reset link has expired. Request a new one from the log in page.'
          : error.message,
      );
      return;
    }
    router.push('/passport');
  }

  return (
    <div className={styles.screen}>
      <div className={styles.stack}>
        <h1>Set a new password</h1>
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
        {status && <p role="status" aria-live="polite">{status}</p>}
      </div>
    </div>
  );
}
