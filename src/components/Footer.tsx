import Image from 'next/image';
import Link from 'next/link';
import { JetBrains_Mono } from 'next/font/google';
import { getFooterSocials } from '@/data/socials';
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
      { href: '/contact', label: 'contact us' },
    ],
  },
] as const;

const socials = getFooterSocials();

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
            <div key={column.title} className={styles.column}>
              <h2 className={styles.heading}>{column.title}</h2>
              <ul className={styles.list}>
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className={styles.link}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className={styles.column}>
            <h2 className={styles.heading}>connect</h2>
            <ul className={styles.list}>
              {socials.map((social) => (
                <li key={social.id}>
                  <a
                    href={social.href}
                    className={styles.link}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    {social.label.toLowerCase()}
                  </a>
                </li>
              ))}
            </ul>
          </div>
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
