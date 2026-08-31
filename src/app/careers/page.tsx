import Link from 'next/link';
import { getActiveJobs } from '@/lib/content';

export const dynamic = 'force-dynamic';

export default async function CareersPage() {
  const jobs = await getActiveJobs();
  return (
    <div className="careers-page">
      <section className="careers-hero">
        <div className="careers-eyebrow">CS CLUB / 2026-27</div>
        <h1>Build what comes next.</h1>
        <p>Bring your ideas, energy, and perspective to the team behind Ontario Tech&apos;s CS community.</p>
      </section>
      <section className="careers-content">
        <div className="careers-section-heading">
          <div><div className="careers-eyebrow">Open roles</div><h2>Find your place on the team.</h2></div>
        </div>
        {jobs.length ? jobs.map((job) => <article className="careers-job-card careers-job-row" key={job.id}>
          <div className="careers-job-title">{job.title} <span>{job.category}</span></div>
          <Link className="careers-primary-button" href={`/careers/${job.id}/apply`}>Apply now <span>↗</span></Link>
        </article>) : <p>There are no open roles right now. Check back soon.</p>}
      </section>
    </div>
  );
}
