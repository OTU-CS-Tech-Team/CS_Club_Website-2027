import type { Metadata } from 'next';
import { JetBrains_Mono, Caveat } from 'next/font/google';
import ContactScene from './ContactScene';
import EmailCopyEnhancer from '@/components/contact/EmailCopyEnhancer';
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
    <div className={`${styles.contactPage} ${styles.vars} ${mono.variable} ${hand.variable}`}>
      <ContactScene fontClasses={`${styles.vars} ${mono.variable} ${hand.variable}`} />
      <EmailCopyEnhancer />
    </div>
  );
}
