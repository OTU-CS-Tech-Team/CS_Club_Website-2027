import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { isAdmin } from '@/lib/admin';
import { createClient } from '@/lib/supabase/server';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'CS Club',
  description:
    'Computer Science Club website — events, HackHive, team, and more.',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const signedIn = !!user;
  const admin = signedIn ? await isAdmin(supabase, user.id) : false;

  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Navbar signedIn={signedIn} isAdmin={admin} />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
