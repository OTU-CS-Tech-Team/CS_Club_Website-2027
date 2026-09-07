import HackHiveMuseum from '@/components/museum/HackHiveMuseum';
import { getArchiveCollections } from '@/data/hackhive';

export const metadata = {
  title: 'HackHive Archive',
  description: 'Museum archive of HackHive projects, year by year.',
};

export default function HackHivePage() {
  return (
    <div>
      <HackHiveMuseum collections={getArchiveCollections()} />
    </div>
  );
}
