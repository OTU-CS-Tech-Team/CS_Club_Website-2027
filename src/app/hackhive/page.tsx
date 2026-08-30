import { IBM_Plex_Sans } from 'next/font/google';
import HackHiveMuseum from '@/components/museum/HackHiveMuseum';
import { getArchiveCollections } from '@/data/hackhive';

const plex = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const metadata = {
  title: 'HackHive Archive',
  description: 'Museum archive of HackHive projects, year by year.',
};

export default function HackHivePage() {
  return (
    <div className={plex.className}>
      <HackHiveMuseum collections={getArchiveCollections()} />
    </div>
  );
}
