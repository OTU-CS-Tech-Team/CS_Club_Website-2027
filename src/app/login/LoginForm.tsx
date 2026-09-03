'use client';

import { useActionState } from 'react';
import { login, type LoginState } from './actions';
import styles from './login.module.css';

const initialState: LoginState = { error: '' };

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <form action={formAction} className={styles.form}>
      <label>
        Ontario Tech email
        <input name="email" type="email" autoComplete="email" required />
      </label>
      <label>
        Password
        <input name="password" type="password" autoComplete="current-password" required />
      </label>
      {state.error ? <p className={styles.error}>{state.error}</p> : null}
      <button type="submit" disabled={pending}>
        {pending ? 'Signing in...' : 'Sign in'}
      </button>
    </form>
  );
}
