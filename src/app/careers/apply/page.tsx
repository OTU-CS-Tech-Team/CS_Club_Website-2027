import { notFound } from 'next/navigation';
import CareerApplicationForm from '@/components/careers/CareerApplicationForm';
import { getActiveJob } from '@/lib/content';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Apply',
};

export default async function GeneralMemberApplicationPage() {
  const job = await getActiveJob('general-member');
  if (!job) notFound();
  return <CareerApplicationForm job={job} />;
}
