import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Log In',
};

export const dynamic = 'force-dynamic';

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
