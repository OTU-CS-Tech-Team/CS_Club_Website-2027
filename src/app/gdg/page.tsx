import Link from 'next/link';
import styles from '@/components/events/events.module.css';

export const metadata = {
  title: 'GDG Project Sprints',
  description:
    'CS Club x GDG Project Sprints — teams of 3-5 students build a complete software project over a multi-week cycle.',
};

// Registration lives in a Google Form that isn't published yet. Drop the URL in
// here and the button stops being a placeholder.
const REGISTRATION_URL = '';

const facts = [
  { label: 'Team size', value: '3–5 students' },
  { label: 'Cycle length', value: '5–6 weeks' },
  { label: 'Cycles per year', value: 'Fall + Winter' },
  { label: 'Format', value: 'Software only, not a competition' },
];

const requirements = [
  'A clear user or problem the project addresses',
  'At least one complete, working end-to-end user flow',
  'Persistent data that is meaningfully integrated',
  'Logic beyond static content or forwarding a prompt to an API',
  'Git/GitHub with evidence of team contribution',
  'A README covering purpose, setup, tech, features, and limitations',
  'Reasonable handling of invalid input and errors',
  'A deployed link where practical, or a clear demo method',
];

const timeline = [
  { when: 'Sept 15', name: 'Registration opens' },
  { when: 'Sept 30', name: 'Registration closes' },
  { when: 'Oct 1–3', name: 'Team matching' },
  { when: 'Oct 5', name: 'Kickoff — “How to Build a Project”' },
  { when: 'Oct 12', name: 'Proposal & scope checkpoint' },
  { when: 'Oct 19–23', name: 'Workshop — Deployments and DevOps' },
  { when: 'Oct 23–26', name: 'Progress check' },
  { when: 'Oct 26–30', name: 'Workshop — Open Source: Building Your Portfolio in Public' },
  { when: 'Oct 31–Nov 1', name: 'Progress check' },
  { when: 'Nov 8', name: 'Submission deadline' },
  { when: 'Nov 11–12', name: 'Showcase & certificates' },
];

export default function GdgPage() {
  return (
    <div className={styles.landing}>
      <div className={styles.shell}>
        <header className={styles.pageHeader}>
          <h1 className={styles.headline}>OTU Project Sprints</h1>
        </header>

        <section className={styles.section} aria-labelledby="sprint-what-heading">
          <Link href="/events" className={styles.backLink}>
            Back to events
          </Link>
          <div className={styles.sectionHead}>
            <h2 id="sprint-what-heading" className={styles.sectionTitle}>
              What are OTU Project Sprints?
            </h2>
          </div>
          <p className={styles.leadCopy}>
            A CS Club × GDG initiative for building the project you keep meaning to start. Teams of
            3–5 pick their own idea — no fixed theme, no sponsor criteria, nothing to win — and
            build it over a 5–6 week cycle, finishing with a working project you can put on your
            resume and explain in an interview.
          </p>
          <p className={styles.leadCopy}>
            Come with your own team, or register solo and we will match you with others at a similar
            experience level. Along the way you get workshops on the common blockers, a CS Club/GDG
            project guide to point you in the right direction, weekly room bookings on campus to
            work alongside other teams, and a certificate (Attended, Bronze, or Gold) based on your
            final submission.
          </p>
          <dl className={styles.factGrid}>
            {facts.map((fact) => (
              <div key={fact.label} className={styles.fact}>
                <dt>{fact.label}</dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className={styles.section} aria-labelledby="sprint-timeline-heading">
          <div className={styles.sectionHead}>
            <h2 id="sprint-timeline-heading" className={styles.sectionTitle}>
              Fall 2026 timeline
            </h2>
          </div>
          <ol className={styles.timeline}>
            {timeline.map((milestone) => (
              <li key={`${milestone.when}-${milestone.name}`}>
                <span>{milestone.when}</span>
                {milestone.name}
              </li>
            ))}
          </ol>
          <p className={styles.noteCopy}>
            Dates may shift slightly. A Winter cycle runs in February — dates to be announced.
          </p>
        </section>

        <section className={styles.section} aria-labelledby="sprint-requirements-heading">
          <div className={styles.sectionHead}>
            <h2 id="sprint-requirements-heading" className={styles.sectionTitle}>
              Project requirements
            </h2>
          </div>
          <ul className={styles.checkList}>
            {requirements.map((requirement) => (
              <li key={requirement}>{requirement}</li>
            ))}
          </ul>
          <p className={styles.noteCopy}>
            AI-assisted coding is allowed with no disclosure required, as long as your team
            understands what it built. Software only — no hardware projects. A UI wrapped around
            someone else’s API is allowed, it just will not score well on originality or technical
            depth.
          </p>
        </section>

        <section className={styles.section} aria-labelledby="sprint-register-heading">
          <div className={styles.sectionHead}>
            <h2 id="sprint-register-heading" className={styles.sectionTitle}>
              Sign up
            </h2>
          </div>
          {REGISTRATION_URL ? (
            <a className={styles.cta} href={REGISTRATION_URL} target="_blank" rel="noreferrer">
              Open the registration form
            </a>
          ) : (
            <p className={styles.emptyCopy}>
              The registration form is coming soon — it will be posted here and announced on the
              events page.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
