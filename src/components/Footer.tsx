import Image from 'next/image';
import Link from 'next/link';
import { JetBrains_Mono } from 'next/font/google';
import FooterGroup from './FooterGroup';
import styles from './footer.module.css';

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
});

const columns = [
  {
    title: 'club',
    links: [
      { href: '/', label: 'home' },
      { href: '/team', label: 'team' },
    ],
  },
  {
    title: 'events',
    links: [
      { href: '/events', label: 'upcoming events' },
      { href: '/gdg', label: 'gdg project sprints' },
    ],
  },
  {
    title: 'hackhive',
    links: [
      { href: '/hackhive', label: 'hackhive info' },
      { href: '/hackhive/archive', label: 'hackhive museum' },
    ],
  },
  {
    title: 'join',
    links: [
      { href: '/careers', label: 'open roles' },
    ],
  },
] as const;

const socials = [
  {
    href: 'https://discord.com/invite/J9AyT8XADz',
    label: 'discord',
  },
  {
    href: 'https://www.instagram.com/otu.csclub/',
    label: 'instagram',
  },
  {
    href: 'https://www.linkedin.com/company/otu-cs-club/',
    label: 'linkedin',
  },
] as const;

export default function Footer() {
  return (
    <footer className={`${styles.footer} ${mono.className}`}>
      <div className={styles.inner}>
        <div className={styles.grid}>
          <div className={styles.brand}>
            <Image
              src="/cs-club-mark.png"
              alt=""
              width={40}
              height={40}
              className={styles.logo}
            />
            <p className={styles.brandName}>ontario tech cs club</p>
          </div>

          {columns.map((column) => (
            <FooterGroup key={column.title} title={column.title}>
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={styles.link}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </FooterGroup>
          ))}

          <FooterGroup title="connect">
            {socials.map((social) => (
              <li key={social.href}>
                <a
                  href={social.href}
                  className={styles.link}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  {social.label}
                </a>
              </li>
            ))}
          </FooterGroup>
        </div>

        <div className={styles.bottom}>
          <p className={styles.copy}>
            © {new Date().getFullYear()} Ontario Tech CS Club. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
