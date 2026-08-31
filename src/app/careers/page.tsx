import Link from 'next/link';

export default function CareersPage() {
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
        <article className="careers-job-card careers-job-row">
          <div className="careers-job-title">CS Club General Member <span>Community</span></div>
          <Link className="careers-primary-button" href="/careers/apply">Apply now <span>↗</span></Link>
        </article>
      </section>
    </div>
  );
}
