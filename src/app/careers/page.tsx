import OpenRoles from '@/components/careers/OpenRoles';
import { getActiveJobs } from '@/lib/content';
import styles from '@/components/careers/careers.module.css';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Open Roles',
  description: 'Open positions with the Ontario Tech Computer Science Club.',
};

export default async function CareersPage() {
  const jobs = await getActiveJobs();

  return (
    <div className={styles.page}>
      <OpenRoles jobs={jobs} />
    </div>
  );
}
