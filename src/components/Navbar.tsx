import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="nav">
      <Link href="/" className="nav-brand">
        CS Club
      </Link>
      <Link href="/">Home</Link>
      <Link href="/team">Team</Link>
      <Link href="/hackhive">HackHive</Link>
      <Link href="/events">Events</Link>
      <Link href="/careers">Careers</Link>
      <Link href="/login">Log in</Link>
      <Link href="/passport">Passport</Link>
      <Link href="/admin">Admin</Link>
    </nav>
  );
}
