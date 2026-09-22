import { notFound } from 'next/navigation';
import CareerApplicationForm from '@/components/careers/CareerApplicationForm';
import { getActiveJob } from '@/lib/content';

type PageProps = {
  params: Promise<{ jobId: string }>;
};

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps) {
  const { jobId } = await params;
  const job = await getActiveJob(jobId);
  return { title: job ? `Apply — ${job.title}` : 'Apply' };
}

export default async function JobApplicationPage({ params }: PageProps) {
  const { jobId } = await params;
  const job = await getActiveJob(jobId);
  if (!job) notFound();
  return <CareerApplicationForm job={job} />;
}
