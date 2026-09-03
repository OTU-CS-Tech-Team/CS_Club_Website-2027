'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

export default function Navbar() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, [supabase]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <nav className="nav">
      <Link href="/" className="nav-brand">
        CS Club
      </Link>
      <Link href="/">Home</Link>
      <Link href="/team">Team</Link>
      <Link href="/hackhive">HackHive</Link>
      <Link href="/events" prefetch={false}>
        Events
      </Link>
      <Link href="/careers">Careers</Link>
      <Link href="/admin">Admin</Link>
      {user ? (
        <>
          <Link href="/passport">Passport</Link>
          <button type="button" className="link-button" onClick={handleSignOut}>
            Sign out
          </button>
        </>
      ) : (
        <Link href="/login">Log in</Link>
      )}
    </nav>
  );
}
