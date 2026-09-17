'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ALLOWED_EMAIL_DOMAIN, EMAIL_DOMAIN_MESSAGE, isAllowedAuthEmail } from '@/lib/authEmail';

type Mode = 'signin' | 'signup';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  // The OAuth callback bounces back here with ?error=... when sign-in is refused.
  useEffect(() => {
    const reason = new URLSearchParams(window.location.search).get('error');
    if (reason === 'sso') setStatus('Google sign-in did not complete. Try again.');
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
      setLoading(false);
      if (error) {
        setStatus(error.message);
        return;
      }
      if (data.session) {
        router.push(nextPath());
        return;
      }
      setStatus('Check your inbox to confirm your account, then sign in.');
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
    <div className="page">
      <h1>Log in</h1>
      <p>
        {mode === 'signup'
          ? 'Create your account to start your member passport.'
          : 'Sign in to see your member passport.'}
      </p>

      <button type="button" className="oauth-button" onClick={handleGoogle} disabled={loading}>
        <span aria-hidden="true">G</span> Continue with Google
      </button>
      <p className="auth-divider">or use your email</p>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={6}
          />
        </label>
        <button type="submit" disabled={loading}>
          {mode === 'signup' ? 'Create account' : 'Sign in'}
        </button>
      </form>

      <button
        type="button"
        className="link-button"
        onClick={() => {
          setMode(mode === 'signup' ? 'signin' : 'signup');
          setStatus('');
        }}
      >
        {mode === 'signup' ? 'Already have an account? Sign in' : 'New here? Create an account'}
      </button>

      {status && (
        <p role="status" aria-live="polite">
          {status}
        </p>
      )}
    </div>
  );
}
