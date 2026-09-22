import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getActiveJob } from '@/lib/content';
import type { JobContentBlock } from '@/types/content';
import DepartmentIcon from '@/components/careers/DepartmentIcon';
import styles from '@/components/careers/careers.module.css';

type PageProps = {
  params: Promise<{ jobId: string }>;
};

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps) {
  const { jobId } = await params;
  const job = await getActiveJob(jobId);
  return { title: job?.title ?? 'Role' };
}

function JobCopy({ text }: { text: string }) {
  const chunks = text.trim().split(/\n{2,}/);
  return (
    <div className={styles.jdCopy}>
      {chunks.map((chunk, index) => {
        const lines = chunk.split('\n').map((line) => line.trim()).filter(Boolean);
        const bullets = lines.length > 0 && lines.every((line) => /^[-•]\s+/.test(line));
        if (bullets) {
          return (
            <ul key={`${index}-${chunk.slice(0, 24)}`}>
              {lines.map((line) => <li key={line}>{line.replace(/^[-•]\s+/, '')}</li>)}
            </ul>
          );
        }
        return <p key={`${index}-${chunk.slice(0, 24)}`}>{chunk}</p>;
      })}
    </div>
  );
}

function visibleSections(sections: JobContentBlock[] | undefined) {
  return (sections ?? []).filter((section) => section.body.trim());
}

export default async function JobDescriptionPage({ params }: PageProps) {
  const { jobId } = await params;
  const job = await getActiveJob(jobId);
  if (!job) notFound();

  const closes = job.closes_at
    ? new Intl.DateTimeFormat('en-CA', { dateStyle: 'medium', timeZone: 'America/Toronto' }).format(new Date(job.closes_at))
    : '';
  const sections = visibleSections(job.content);

  return (
    <article className={styles.jd}>
      <Link href="/careers" className={styles.backLink}>
        <span aria-hidden="true">←</span> Back to careers
      </Link>
      <div className={styles.jdGrid}>
        <aside className={styles.jdAside}>
          <p className={styles.jdDepartment}>
            <DepartmentIcon category={job.category} />
            <strong>{job.category}</strong>
          </p>
          <h1 className={styles.jdTitle}>{job.title}</h1>
          <div className={styles.jdMeta}>
            {job.location ? <span>{job.location}</span> : null}
            {job.commitment ? <span>{job.commitment}</span> : null}
            <span>{closes ? `Closes ${closes}` : 'Open until filled'}</span>
          </div>
          <Link href={`/careers/${job.id}/apply`} className={styles.jdApply}>
            Apply now <span aria-hidden="true">→</span>
          </Link>
        </aside>
        <div>
          {sections.map((section) => (
            <section className={styles.jdSection} key={section.id}>
              {section.builtin === 'description' ? null : <h2>{section.title}</h2>}
              <JobCopy text={section.body} />
            </section>
          ))}
        </div>
      </div>
    </article>
  );
}
