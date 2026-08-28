import { Caveat } from 'next/font/google';
import CorkboardWall from '@/components/corkboard/CorkboardWall';
import { hackhiveProjects } from '@/data/hackhive';

const caveat = Caveat({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  display: 'swap',
});

export const metadata = {
  title: 'HackHive Archive — Corkboard',
  description: 'Museum-style archive of past HackHive projects.',
};

export default function HackHivePage() {
  return (
    <div style={{ padding: '2.5rem 1.5rem 4rem' }}>
      <CorkboardWall
        projects={hackhiveProjects}
        showStickyNote
        handwrittenClass={caveat.className}
      />
    </div>
  );
}
