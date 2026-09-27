import { notFound } from 'next/navigation';
import CareerApplicationForm from '@/components/careers/CareerApplicationForm';
import { getActiveJob, getActiveJobs } from '@/lib/content';

type PageProps = {
  params: Promise<{ jobId: string }>;
};

export const revalidate = 3600;

export async function generateStaticParams() {
  const jobs = await getActiveJobs();
  return jobs.map((job) => ({ jobId: job.id }));
}

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
