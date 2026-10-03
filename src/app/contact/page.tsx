import type { Metadata } from 'next';
import { JetBrains_Mono, Caveat } from 'next/font/google';
import { SOCIALS } from '@/data/socials';
import SocialIcon from '@/components/SocialIcon';
import ContactScene from './ContactScene';
import styles from './contact.module.css';

export const metadata: Metadata = {
  title: 'Contact Us | OTU CS Club',
  description:
    'Get in touch with the Ontario Tech CS Club. Find our socials, email, or leave a suggestion in the drop box.',
};

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
  variable: '--font-mono',
});

const hand = Caveat({
  subsets: ['latin'],
  weight: ['500', '700'],
  display: 'swap',
  variable: '--font-hand',
});

export default function ContactPage() {
  return (
    <div className={`${styles.page} ${mono.variable} ${hand.variable}`}>
      <section className={styles.section} aria-labelledby="findus">
        <p className={styles.eyebrow}>
          <span>01</span>
          <span className={styles.eyebrowRule} aria-hidden="true" />
          <span>Find us</span>
        </p>
        <h1 id="findus" className={styles.headline}>
          Say hi. Drop an idea.
        </h1>

        <ul className={styles.socials} aria-label="Contact and socials">
          {SOCIALS.map((social) => (
            <li key={social.id}>
              <a
                href={social.href}
                className={styles.socialLink}
                target={social.id === 'email' ? undefined : '_blank'}
                rel={social.id === 'email' ? undefined : 'noreferrer noopener'}
                aria-label={social.label}
                title={social.label}
              >
                <SocialIcon id={social.id} />
              </a>
            </li>
          ))}
        </ul>
      </section>

      <ContactScene />
    </div>
  );
}
