import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: 'CS CLUB',
    template: '%s | CS Club',
  },
  description:
    'Computer Science Club website — events, HackHive, team, and more.',
  icons: {
    icon: [{ url: '/cs_club_logo.png', type: 'image/png' }],
    shortcut: '/cs_club_logo.png',
    apple: '/cs_club_logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
