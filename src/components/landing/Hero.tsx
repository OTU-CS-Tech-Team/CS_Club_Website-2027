import Image from 'next/image';
import Link from 'next/link';
import styles from './landing.module.css';

const socials = [
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/otu.csclub/',
    src: '/socials/instagram.svg',
  },
  {
    label: 'X',
    href: 'https://x.com/otucsclub',
    src: '/socials/x.svg',
  },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/company/otu-cs-club/',
    src: '/socials/linkedin.svg',
  },
  {
    label: 'Discord',
    href: 'https://discord.com/invite/J9AyT8XADz',
    src: '/socials/discord.svg',
  },
];

export default function Hero() {
  return (
    <section className={styles.hero} aria-label="Welcome">
      <div className={styles.brandCol}>
        <div className={styles.lockup}>
          <Image
            src="/cs_club_logo.png"
            alt="CS Club logo"
            width={417}
            height={325}
            className={styles.logo}
            priority
          />
        </div>
        <ul className={styles.socials}>
          {socials.map((item) => (
            <li key={item.label}>
              <a href={item.href} target="_blank" rel="noreferrer" aria-label={item.label}>
                <img src={item.src} alt="" width={22} height={22} />
              </a>
            </li>
          ))}
        </ul>
      </div>
      <div className={styles.heroCopy}>
        <h1 className={styles.headline}>
          Welcome to Ontario Tech’s
          <br />
          Computer Science Club.
        </h1>
        <p className={styles.slogan}>connecting people through technology</p>
        <Link href="/careers" className={styles.cta}>
          Join
        </Link>
      </div>
    </section>
  );
}
