'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ALLOWED_EMAIL_DOMAIN, EMAIL_DOMAIN_MESSAGE, isAllowedAuthEmail } from '@/lib/authEmail';
import { subscribeGuest, subscribeLoggedIn } from '@/app/mailing-list/actions';
import styles from './login.module.css';

type Mode = 'signin' | 'signup' | 'reset';

const HEADINGS: Record<Mode, [string, string]> = {
  signin: ['Log in', 'Sign in to see your member passport.'],
  signup: ['Create an account', 'Create your account to start your member passport.'],
  reset: ['Reset password', "Enter your email and we'll send you a link to set a new password."],
};

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  const [alerts, setAlerts] = useState(false);
  const [loading, setLoading] = useState(false);

  // The OAuth callback bounces back here with ?error=... when sign-in is refused.
  useEffect(() => {
    const reason = new URLSearchParams(window.location.search).get('error');
    if (reason === 'sso') setStatus('Sign-in did not complete. Try again.');
    if (reason === 'domain') setStatus(EMAIL_DOMAIN_MESSAGE);
  }, []);

  async function handleGoogle() {
    setStatus('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath())}`,
        // Nudges Google to show Ontario Tech accounts first; the real check is server-side.
        queryParams: { hd: ALLOWED_EMAIL_DOMAIN },
      },
    });
    if (error) {
      setStatus(error.message);
      setLoading(false);
    }
    // On success the browser leaves for Google, so nothing to reset here.
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('');

    if (mode === 'reset') {
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login/reset`,
      });
      setLoading(false);
      // Same message either way on success so the form doesn't reveal which emails have accounts.
      setStatus(error ? error.message : 'If that email has an account, a reset link is on its way. Open it in this browser.');
      return;
    }

    if (mode === 'signup' && !isAllowedAuthEmail(email)) {
      setStatus(EMAIL_DOMAIN_MESSAGE);
      return;
    }

    setLoading(true);

    if (mode === 'signup') {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm?next=/passport`,
        },
      });
      if (error) {
        setLoading(false);
        setStatus(error.message);
        return;
      }

      // Opt-in reuses the mailing list's own double opt-in: an account with a
      // session owns its address already, otherwise it needs the confirm email.
      let alertsFailed = false;
      if (alerts) {
        try {
          if (data.session) await subscribeLoggedIn();
          else await subscribeGuest(email.split('@')[0], email);
        } catch {
          alertsFailed = true;
        }
      }
      setLoading(false);

      if (data.session) {
        router.push(nextPath());
        return;
      }
      setStatus(
        [
          'Check your inbox to confirm your account, then sign in.',
          alerts && !alertsFailed ? 'A second email confirms your event alerts.' : '',
          alertsFailed ? 'We could not sign you up for alerts — you can join from the home page.' : '',
        ]
          .filter(Boolean)
          .join(' '),
      );
      setMode('signin');
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setStatus(error.message);
      return;
    }
    router.push(nextPath());
  }

  function nextPath() {
    const next = new URLSearchParams(window.location.search).get('next');
    return next ? decodeURIComponent(next) : '/passport';
  }

  return (
    <div className={styles.screen}>
      <div className={styles.stack}>
      <h1>{HEADINGS[mode][0]}</h1>
      <p>{HEADINGS[mode][1]}</p>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />
        </label>
        {mode === 'reset' ? null : (
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              required
              minLength={6}
            />
          </label>
        )}
        {mode === 'signin' ? (
          <button type="button" className="link-button auth-forgot" onClick={() => { setMode('reset'); setStatus(''); }}>
            Forgot password?
          </button>
        ) : null}
        {mode === 'signup' ? (
          <label className="auth-check">
            <input
              type="checkbox"
              checked={alerts}
              onChange={(event) => setAlerts(event.target.checked)}
            />
            Email me about upcoming events
          </label>
        ) : null}
        <button type="submit" disabled={loading}>
          {mode === 'signup' ? 'Create account' : mode === 'reset' ? 'Send reset link' : 'Sign in'}
        </button>
      </form>

      {mode === 'reset' ? null : (
        <>
          <p className="auth-divider">or</p>
          <button type="button" className="oauth-button" onClick={handleGoogle} disabled={loading}>
            <span aria-hidden="true">G</span> Continue with Google
          </button>
        </>
      )}

      <button
        type="button"
        className="link-button"
        onClick={() => {
          setMode(mode === 'signin' ? 'signup' : 'signin');
          setStatus('');
        }}
      >
        {mode === 'signin' ? 'New here? Create an account' : mode === 'reset' ? 'Back to sign in' : 'Already have an account? Sign in'}
      </button>

      {status && (
        <p role="status" aria-live="polite">
          {status}
        </p>
      )}
      </div>
    </div>
  );
}
